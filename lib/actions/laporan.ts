import { z } from "zod";
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
  const { error } = await (await createClient()).from("chapter_reports").update({ status: "selesai" }).eq("id", id.data);
  if (error) return { error: "Gagal menyimpan." };
  refresh();
  return { ok: "Selesai." };
}
