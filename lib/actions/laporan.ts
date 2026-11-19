import { z } from "zod";
import { announcementHtml, sendEmails } from "@/lib/announce-mail";
import { getCurrentUser, requireAdmin } from "@/lib/dal";
import { refresh } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; ok?: string };

const report = z.object({
  chapter_id: z.uuid().optional(),
  question_id: z.uuid().optional(),
  kind: z.enum(["salah", "tidak-jelas", "lainnya"]),
  note: z.string().trim().min(1, "Tulis apa yang perlu diperbaiki.").max(500, "Paling panjang 500 karakter."),
});

// Chapter pages are public, so a signed-out caller gets a message, not a redirect.
export async function laporkan(_: State, form: FormData): Promise<State> {
  const user = await getCurrentUser();
  if (!user) return { error: "Masuk dulu untuk mengirim laporan." };
  const parsed = report.safeParse(Object.fromEntries(form));
  if (parsed.success && !parsed.data.chapter_id === !parsed.data.question_id) return { error: "Laporan tidak valid." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Isian tidak valid." };
  const { error } = await (await createClient()).from("chapter_reports").insert({ ...parsed.data, user_id: user.id });
  if (error) return { error: error.code === "23505" ? "Laporanmu untuk ini masih diproses. Terima kasih." : "Gagal mengirim laporan." };
  return { ok: "Terkirim. Terima kasih sudah membantu memperbaiki materi." };
}

export async function selesaikanLaporan(_: State, form: FormData): Promise<State> {
  await requireAdmin();
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Laporan tidak valid." };
  const db = await createClient();
  const { data: r, error } = await db
    .from("chapter_reports")
    .update({ status: "selesai" })
    .eq("id", id.data)
    .eq("status", "baru")
    .select("user_id, chapters(title), exam_questions(prompt)")
    .maybeSingle();
  if (error) return { error: "Gagal menyimpan." };
  if (r) await kabari(db, r as unknown as Done);
  refresh();
  return { ok: "Selesai." };
}

type Done = { user_id: string; chapters: { title: string } | null; exam_questions: { prompt: string } | null };

// Tell the reporter it was handled. A mail failure never undoes "selesai".
async function kabari(db: Awaited<ReturnType<typeof createClient>>, r: Done) {
  try {
    const { data } = await db.rpc("admin_users");
    const to = ((data ?? []) as { user_id: string; email: string }[]).find((p) => p.user_id === r.user_id)?.email;
    if (!to) return;
    const what = r.chapters ? `bab "${r.chapters.title}"` : `soal ujian "${(r.exam_questions?.prompt ?? "").slice(0, 120)}"`;
    await sendEmails([to], "Laporanmu sudah ditangani", announcementHtml({
      title: "Laporanmu sudah ditangani",
      body: `Terima kasih sudah melaporkan ${what}. Materinya sudah kami periksa dan diperbaiki kalau memang perlu.`,
      chip: "Laporan",
      footnote: "Kamu menerima email ini karena mengirim laporan di Ruang Materi.",
    }));
  } catch {}
}
