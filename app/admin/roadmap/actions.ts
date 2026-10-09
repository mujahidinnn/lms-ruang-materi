"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type RoadmapState = { error?: string; ok?: string };

const slug = z.string().regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka dan tanda hubung.");
const id = z.uuid();

// Trigger messages (P0001) are written for people; anything else is not.
function fail(error: { code?: string; message: string }, fallback: string): RoadmapState {
  if (error.code === "P0001") return { error: error.message };
  if (error.code === "23505") return { error: "Sudah ada." };
  return { error: fallback };
}

function done(track: string) {
  updateTag("content");
  revalidatePath(`/admin/roadmap/${track}`);
}

export async function buatTrack(_: RoadmapState, form: FormData): Promise<RoadmapState> {
  await requireAdmin();
  const parsed = z
    .object({ slug, title: z.string().trim().min(1, "Judul wajib diisi."), description: z.string().trim() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await (await createClient()).from("tracks").insert(parsed.data);
  if (error) return fail(error, "Gagal membuat track.");
  redirect(`/admin/roadmap/${parsed.data.slug}`);
}

export async function simpanTrack(_: RoadmapState, form: FormData): Promise<RoadmapState> {
  await requireAdmin();
  const track = slug.parse(form.get("track"));
  const parsed = z
    .object({ title: z.string().trim().min(1, "Judul wajib diisi."), description: z.string().trim() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await (await createClient()).from("tracks").update(parsed.data).eq("slug", track);
  if (error) return fail(error, "Gagal menyimpan.");
  done(track);
  return { ok: "Tersimpan." };
}

export async function tambahNode(_: RoadmapState, form: FormData): Promise<RoadmapState> {
  await requireAdmin();
  const track = slug.parse(form.get("track"));
  const db = await createClient();
  const { data: t } = await db.from("tracks").select("id, track_nodes(count)").eq("slug", track).single();
  if (!t) return { error: "Track tidak ditemukan." };

  const { error } = await db.from("track_nodes").insert({
    track_id: t.id,
    topic_id: id.parse(form.get("topic_id")),
    position: t.track_nodes[0]?.count ?? 0,
  });
  if (error) return fail(error, "Gagal menambah topik.");
  done(track);
  return {};
}

export async function simpanNode(_: RoadmapState, form: FormData): Promise<RoadmapState> {
  await requireAdmin();
  const track = slug.parse(form.get("track"));
  const { error } = await (await createClient())
    .from("track_nodes")
    .update({
      position: z.coerce.number().int().min(0).parse(form.get("position")),
      optional: form.get("optional") === "on",
      // An edit goes live only when the track is published again.
      status: "draft",
    })
    .eq("id", id.parse(form.get("id")));
  if (error) return fail(error, "Gagal menyimpan topik.");
  done(track);
  return {};
}

export async function tambahEdge(_: RoadmapState, form: FormData): Promise<RoadmapState> {
  await requireAdmin();
  const track = slug.parse(form.get("track"));
  const { error } = await (await createClient()).from("track_edges").insert({
    from_node_id: id.parse(form.get("from")),
    to_node_id: id.parse(form.get("to")),
  });
  if (error) return fail(error, "Gagal menambah prasyarat.");
  done(track);
  return {};
}

// Deletes take effect right away, also on the published roadmap.
export async function hapus(_: RoadmapState, form: FormData): Promise<RoadmapState> {
  await requireAdmin();
  const track = slug.parse(form.get("track"));
  const table = z.enum(["track_nodes", "track_edges"]).parse(form.get("table"));
  const { error } = await (await createClient()).from(table).delete().eq("id", id.parse(form.get("id")));
  if (error) return fail(error, "Gagal menghapus.");
  done(track);
  return {};
}

export async function terbitkanTrack(track: string): Promise<RoadmapState> {
  await requireAdmin();
  const { error } = await (await createClient()).rpc("publish_track", { p_slug: slug.parse(track) });
  if (error) return fail(error, "Gagal menerbitkan.");
  done(track);
  return { ok: "Roadmap diterbitkan." };
}

export async function tarikTrack(track: string): Promise<RoadmapState> {
  await requireAdmin();
  const { error } = await (await createClient()).from("tracks").update({ status: "draft" }).eq("slug", slug.parse(track));
  if (error) return fail(error, "Gagal menarik roadmap.");
  done(track);
  return { ok: "Roadmap ditarik, tidak tampil di publik." };
}

export async function hapusTrack(track: string): Promise<RoadmapState> {
  await requireAdmin();
  const { error } = await (await createClient()).from("tracks").delete().eq("slug", slug.parse(track));
  if (error) return fail(error, "Gagal menghapus roadmap.");
  updateTag("content");
  redirect("/admin/roadmap");
}
