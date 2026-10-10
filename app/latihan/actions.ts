"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Saves a finished set for a signed-in learner. Logged out it does nothing:
// RLS has no insert policy for anon, so saved comes back false. needsConsent
// means require_consent() refused it until the learner confirms in /profil.
export async function simpanLatihan(topicId: string, correct: number, total: number): Promise<{ saved: boolean; needsConsent?: boolean }> {
  const row = z
    .object({ topic_id: z.uuid(), correct: z.number().int().min(0), total: z.number().int().min(1).max(100) })
    .safeParse({ topic_id: topicId, correct, total });
  if (!row.success) return { saved: false };
  const { error } = await (await createClient()).from("practice_sessions").insert(row.data);
  return { saved: !error, needsConsent: error?.hint === "consent" };
}
