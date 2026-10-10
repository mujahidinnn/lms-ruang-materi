"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type UjianState = { error?: string };

// start_exam_attempt returns the running attempt if there is one, so a
// double click does not use a second attempt.
export async function mulaiUjian(_: UjianState, form: FormData): Promise<UjianState> {
  const input = z.object({ exam: z.uuid(), slug: z.string().regex(/^[a-z0-9-]+$/) }).safeParse(Object.fromEntries(form));
  if (!input.success) return { error: "Ujian tidak dikenal." };
  const { exam: examId, slug } = input.data;
  const { data, error } = await (await createClient()).rpc("start_exam_attempt", { p_exam: examId });
  if (error) return { error: error.code === "P0001" ? error.message : "Gagal memulai ujian, coba lagi." };
  redirect(`/ujian/${slug}/${data}`);
}

export async function kumpulkanUjian(attemptId: string, answers: Record<string, number>): Promise<UjianState> {
  const input = z
    .object({ id: z.uuid(), body: z.record(z.uuid(), z.number().int().min(0).max(3)) })
    .safeParse({ id: attemptId, body: answers });
  if (!input.success) return { error: "Jawaban tidak valid, muat ulang halaman." };
  const { error } = await (await createClient()).rpc("submit_exam_attempt", { p_attempt: input.data.id, p_answers: input.data.body });
  if (error) return { error: error.code === "P0001" ? error.message : "Gagal mengumpulkan, coba lagi." };
  return {};
}
