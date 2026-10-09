"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type UjianState = { error?: string };

// start_exam_attempt returns the running attempt if there is one, so a
// double click does not use a second attempt.
export async function mulaiUjian(_: UjianState, form: FormData): Promise<UjianState> {
  const examId = z.uuid().parse(form.get("exam"));
  const slug = z.string().regex(/^[a-z0-9-]+$/).parse(form.get("slug"));
  const { data, error } = await (await createClient()).rpc("start_exam_attempt", { p_exam: examId });
  if (error) return { error: error.code === "P0001" ? error.message : "Gagal memulai ujian, coba lagi." };
  redirect(`/ujian/${slug}/${data}`);
}

export async function kumpulkanUjian(attemptId: string, answers: Record<string, number>): Promise<UjianState> {
  const id = z.uuid().parse(attemptId);
  const body = z.record(z.uuid(), z.number().int().min(0).max(3)).parse(answers);
  const { error } = await (await createClient()).rpc("submit_exam_attempt", { p_attempt: id, p_answers: body });
  if (error) return { error: error.code === "P0001" ? error.message : "Gagal mengumpulkan, coba lagi." };
  return {};
}
