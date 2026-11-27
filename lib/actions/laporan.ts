import { z } from "zod";
import { announcementHtml, sendEmails } from "@/lib/announce-mail";
import { getCurrentUser, requireAdmin } from "@/lib/dal";
import { audit } from "@/lib/audit";
import { refresh } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; ok?: string };

const report = z.object({
  chapter_id: z.uuid().optional(),
  question_id: z.uuid().optional(),
  kind: z.enum(["salah", "tidak-jelas", "lainnya", "pertanyaan"]),
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

const done = z.object({
  id: z.uuid(),
  response: z.string().trim().max(2000, "Tanggapan paling panjang 2000 karakter.").transform((s) => s || null),
  source_url: z
    .string()
    .trim()
    .max(500, "Link terlalu panjang.")
    .refine((s) => !s || /^(https?:\/\/\S+|\/\S*)$/.test(s), "Link harus diawali http(s):// atau /.")
    .transform((s) => s || null),
});

export async function selesaikanLaporan(_: State, form: FormData): Promise<State> {
  const admin = await requireAdmin();
  const parsed = done.safeParse({ id: form.get("id"), response: form.get("response") ?? "", source_url: form.get("source_url") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Laporan tidak valid." };
  const { id, ...answer } = parsed.data;
  const db = await createClient();
  const { data: r, error } = await db
    .from("chapter_reports")
    .update({ status: "selesai", resolved_at: new Date().toISOString(), ...answer })
    .eq("id", id)
    .eq("status", "baru")
    .select("user_id, kind, note, response, source_url, chapters(title), exam_questions(prompt)")
    .maybeSingle();
  if (error) return { error: "Gagal menyimpan." };
  if (r) {
    const d = r as unknown as Done;
    await kabari(db, d);
    await audit(admin, "Selesaikan laporan", where(d), [["Laporan", d.note], ["Tanggapan", d.response ?? ""], ["Link sumber", d.source_url ?? ""]]);
  }
  refresh();
  return { ok: "Selesai." };
}

type Done = { user_id: string; kind: string; note: string; response: string | null; source_url: string | null; chapters: { title: string } | null; exam_questions: { prompt: string } | null };
const where = (r: Done) => (r.chapters ? `bab "${r.chapters.title}"` : `soal ujian "${(r.exam_questions?.prompt ?? "").slice(0, 120)}"`);

// Tell the reporter it was handled. A mail failure never undoes "selesai".
async function kabari(db: Awaited<ReturnType<typeof createClient>>, r: Done) {
  try {
    const { data } = await db.rpc("admin_users");
    const to = ((data ?? []) as { user_id: string; email: string }[]).find((p) => p.user_id === r.user_id)?.email;
    if (!to) return;
    const what = where(r);
    const ask = r.kind === "pertanyaan";
    const thanks = ask
      ? `Terima kasih sudah bertanya tentang ${what}. Kami sudah menanggapinya dan menyesuaikan materi kalau perlu. Buka bab itu lagi untuk melihat perubahannya.`
      : `Terima kasih sudah melaporkan ${what}. Materinya sudah kami periksa dan diperbaiki kalau memang perlu.`;
    await sendEmails([to], ask ? "Pertanyaanmu sudah dijawab" : "Laporanmu sudah ditangani", announcementHtml({
      title: ask ? "Pertanyaanmu sudah dijawab" : "Laporanmu sudah ditangani",
      body: r.response ? `${thanks}\n\n${ask ? "Jawaban" : "Perbaikan"}:\n${r.response}` : thanks,
      link: r.source_url,
      chip: ask ? "Pertanyaan" : "Laporan",
      footnote: `Kamu menerima email ini karena mengirim ${ask ? "pertanyaan" : "laporan"} di Ruang Materi.`,
    }));
  } catch {}
}
