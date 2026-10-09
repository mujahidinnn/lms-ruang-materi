"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
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
  await requireAdmin();
  const parsed = settings.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Isi semua angka dengan benar." };
  const { id, ...fields } = parsed.data;
  const { error } = await (await createClient()).from("exams").update(fields).eq("id", id);
  if (error) return { error: error.code === "P0001" ? error.message : "Gagal menyimpan." };
  updateTag("content");
  revalidatePath("/admin/ujian");
  return { ok: "Tersimpan." };
}
