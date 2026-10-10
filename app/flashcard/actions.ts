"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type NilaiResult = { saved: boolean; error?: string; guest?: boolean };

// Scheduling lives in review_flashcard(); this only passes the rating on.
export async function nilaiKartu(cardId: string, rating: number): Promise<NilaiResult> {
  const input = z.object({ id: z.uuid(), r: z.number().int().min(1).max(3) }).safeParse({ id: cardId, r: rating });
  if (!input.success) return { saved: false, error: "Kartu tidak dikenal." };
  const { error } = await (await createClient()).rpc("review_flashcard", { p_card: input.data.id, p_rating: input.data.r });
  if (!error) return { saved: true };
  if (error.code === "42501") return { saved: false, guest: true };
  return { saved: false, error: error.code === "P0001" ? error.message : "Gagal menyimpan, coba lagi." };
}
