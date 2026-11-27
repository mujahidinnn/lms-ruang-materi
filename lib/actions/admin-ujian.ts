import { invalidateContent } from "@/lib/cache";
import { refresh } from "@/lib/request";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const settings = z.object({
  id: z.uuid(),
  duration_minutes: z.coerce.number().int().min(1).max(180),
  max_attempts: z.coerce.number().int().min(1).max(10),
  pass_score: z.coerce.number().int().min(1).max(100),
  question_count: z.coerce.number().int().min(1).max(100),
});

// The bank rule (2x question_count) is checked by a trigger on exams.
export async function simpanUjian(_: { error?: string; ok?: string }, form: FormData) {
  const admin = await requireAdmin();
  const parsed = settings.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Isi semua angka dengan benar." };
  const { id, ...fields } = parsed.data;
  const db = await createClient();
  const { data: old } = await db.from("exams").select("duration_minutes, max_attempts, pass_score, question_count, topics(title, slug)").eq("id", id).maybeSingle();
  const { error } = await db.from("exams").update(fields).eq("id", id);
  if (error) return { error: error.code === "P0001" ? error.message : "Gagal menyimpan." };
  const topic = old?.topics as unknown as { title: string; slug: string } | null;
  const was = (k: keyof typeof fields, unit: string) => (old && old[k] !== fields[k] ? `${old[k]} -> ${fields[k]} ${unit}` : `${fields[k]} ${unit}`);
  await audit(admin, "Simpan ujian", topic?.title ?? id, [
    ["Kelas", topic?.title ?? ""],
    ["Durasi", was("duration_minutes", "menit")],
    ["Percobaan", was("max_attempts", "kali")],
    ["Nilai lulus", was("pass_score", "poin")],
    ["Soal per percobaan", was("question_count", "soal")],
    ["Halaman admin", topic ? `/admin/topik/${topic.slug}#ujian` : ""],
  ]);
  invalidateContent();
  refresh();
  return { ok: "Tersimpan." };
}
