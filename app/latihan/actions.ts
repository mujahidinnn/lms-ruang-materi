"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Saves a finished set for a signed-in learner. Logged out it does nothing:
// RLS has no insert policy for anon, so saved comes back false.
export async function simpanLatihan(topicId: string, correct: number, total: number): Promise<{ saved: boolean }> {
  const row = z
    .object({ topic_id: z.uuid(), correct: z.number().int().min(0), total: z.number().int().min(1).max(100) })
    .parse({ topic_id: topicId, correct, total });
  const { error } = await (await createClient()).from("practice_sessions").insert(row);
  return { saved: !error };
}
