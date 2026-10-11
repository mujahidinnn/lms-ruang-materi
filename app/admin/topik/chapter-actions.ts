"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const slug = z.string().regex(/^[a-z0-9-]+$/).refine((s) => s !== "slide", "slug slide dipakai halaman slide");
const optionalSlide = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(1).nullable());

function done(topicSlug: string) {
  updateTag("content");
  revalidatePath(`/admin/topik/${topicSlug}`);
}

export async function simpanBab(form: FormData) {
  await requireAdmin();
  const f = z
    .object({
      id: z.uuid(),
      topic: z.string(),
      title: z.string().trim().min(1).max(120),
      slug,
      body: z.string(),
      est_minutes: z.coerce.number().int().min(1).max(60),
      slide_from: optionalSlide,
      slide_to: optionalSlide,
    })
    .parse(Object.fromEntries(form));
  const { id, topic, ...row } = f;
  const { error } = await (await createClient()).from("chapters").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  done(topic);
}

// New chapters join the set an admin sees: drafts when the topic has draft
// chapters (published with the next Terbitkan), else live right away.
export async function tambahBab(form: FormData) {
  await requireAdmin();
  const { topic } = z.object({ topic: z.string() }).parse(Object.fromEntries(form));
  const db = await createClient();
  const { data: t } = await db.from("topics").select("id, chapters(status, position)").eq("slug", topic).single();
  if (!t) throw new Error("topik tidak ditemukan");
  const rows = t.chapters as { status: string; position: number }[];
  const status = rows.some((c) => c.status === "draft") ? "draft" : "published";
  const position = Math.max(-1, ...rows.filter((c) => c.status === status).map((c) => c.position)) + 1;
  const { error } = await db.from("chapters").insert({
    topic_id: t.id, status, position, slug: `bab-${position + 1}`, title: `Bab ${position + 1}`, body: "Tulis isi bab di sini.",
  });
  if (error) throw new Error(error.message);
  done(topic);
}

export async function hapusBab(form: FormData) {
  await requireAdmin();
  const { id, topic } = z.object({ id: z.uuid(), topic: z.string() }).parse(Object.fromEntries(form));
  const { error } = await (await createClient()).from("chapters").delete().eq("id", id);
  if (error) throw new Error(error.message);
  done(topic);
}

// Swaps positions with the neighbour; the unique key is deferred.
export async function geserBab(form: FormData) {
  await requireAdmin();
  const { id, topic, arah } = z.object({ id: z.uuid(), topic: z.string(), arah: z.enum(["naik", "turun"]) }).parse(Object.fromEntries(form));
  const db = await createClient();
  const { data: c } = await db.from("chapters").select("topic_id, status, position").eq("id", id).single();
  if (!c) throw new Error("bab tidak ditemukan");
  const { data: other } = await db
    .from("chapters")
    .select("id, position")
    .eq("topic_id", c.topic_id)
    .eq("status", c.status)
    .order("position", { ascending: arah === "turun" })
    .filter("position", arah === "naik" ? "lt" : "gt", c.position)
    .limit(1)
    .maybeSingle();
  if (!other) return;
  const { error } = await db.rpc("swap_chapters", { a: id, b: other.id });
  if (error) throw new Error(error.message);
  done(topic);
}
