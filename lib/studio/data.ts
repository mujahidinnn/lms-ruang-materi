import type { Check, Material } from "./schema";
import { createClient } from "@/lib/supabase/server";

export type Def = { id: string; slug: string; title: string; summary: string; level: "pemula" | "menengah" | "lanjut" | "pro"; est_hours: number | null; status: "draft" | "published" };
export type Step = { id: string; def_id: string; stage: string; position: number; slug: string; title: string; body: string; est_minutes: number | null; materials: Material[]; checks: Check[] };

const DEF = "id, slug, title, summary, level, est_hours, status";
const STEP = "id, def_id, stage, position, slug, title, body, est_minutes, materials, checks";

// RLS decides what comes back: learners get published projects while they have
// the feature, admins get everything.
export async function listDefs(): Promise<Def[]> {
  const { data } = await (await createClient()).from("studio_defs").select(DEF).order("position").order("created_at");
  return (data ?? []) as Def[];
}

export async function getDef(slug: string): Promise<{ def: Def; steps: Step[] } | null> {
  const db = await createClient();
  const { data: def } = await db.from("studio_defs").select(DEF).eq("slug", slug).maybeSingle();
  if (!def) return null;
  const { data: steps } = await db.from("studio_steps").select(STEP).eq("def_id", def.id).order("position");
  return { def: def as Def, steps: (steps ?? []) as unknown as Step[] };
}

export async function doneItems(userId: string, project: string): Promise<Set<string>> {
  const { data } = await (await createClient()).from("studio_checks").select("item").eq("user_id", userId).eq("project", project);
  return new Set((data ?? []).map((r) => r.item));
}
