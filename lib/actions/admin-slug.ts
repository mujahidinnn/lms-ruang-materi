import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { SLUG_RE } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

export type SlugCheck = { ok: boolean; message?: string };

// Is this slug free? topics and tracks are unique site-wide; a chapter slug
// only has to be unique inside its class and draft/published copy.
export async function slugTersedia(raw: { kind: "topics" | "tracks" | "chapters"; slug: string; topic?: string; chapterId?: string }): Promise<SlugCheck> {
  await requireAdmin();
  const a = z
    .object({ kind: z.enum(["topics", "tracks", "chapters"]), slug: z.string().max(60), topic: z.string().optional(), chapterId: z.uuid().optional() })
    .parse(raw);
  if (!SLUG_RE.test(a.slug)) return { ok: false, message: "Hanya huruf kecil, angka dan tanda hubung." };
  const db = await createClient();
  if (a.kind === "chapters") {
    if (a.slug === "slide") return { ok: false, message: "\"slide\" dipakai halaman slide." };
    const { data: t } = await db.from("topics").select("id").eq("slug", a.topic ?? "").maybeSingle();
    if (!t) return { ok: false, message: "Kelas tidak ditemukan." };
    const { data: me } = a.chapterId ? await db.from("chapters").select("status").eq("id", a.chapterId).maybeSingle() : { data: null };
    let q = db.from("chapters").select("id").eq("topic_id", t.id).eq("slug", a.slug).limit(1);
    if (me) q = q.eq("status", me.status);
    if (a.chapterId) q = q.neq("id", a.chapterId);
    const { data } = await q;
    return data?.length ? { ok: false, message: "Sudah dipakai bab lain di kelas ini." } : { ok: true };
  }
  const { data } = await db.from(a.kind).select("id").eq("slug", a.slug).limit(1);
  return data?.length ? { ok: false, message: a.kind === "topics" ? "Sudah dipakai kelas lain." : "Sudah dipakai roadmap lain." } : { ok: true };
}
