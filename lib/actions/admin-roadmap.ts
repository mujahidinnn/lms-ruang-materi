import { invalidateContent } from "@/lib/cache";
import { redirect, refresh } from "@/lib/request";
import { z } from "zod";
import { TRACK_PRESETS } from "@/components/ui/icons";
import { audit, type Meta } from "@/lib/audit";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type RoadmapState = { error?: string; ok?: string };

const slug = z.string().regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka dan tanda hubung.");
const id = z.uuid();

// "" = automatic, a preset key, or inline SVG. The SVG is shown through <img>,
// where scripts never run; the checks keep out junk and oversized input.
const icon = z
  .string()
  .trim()
  .max(8000, "SVG terlalu besar, maksimal 8 KB.")
  .refine((v) => !v || v in TRACK_PRESETS || (/^<svg[\s>]/.test(v) && /<\/svg>$/.test(v)), "Ikon harus berupa pilihan atau kode SVG utuh (<svg ...>...</svg>).")
  .refine((v) => !/<script|<foreignObject|\son\w+\s*=/i.test(v), "SVG tidak boleh berisi script atau event.")
  // <img> needs the namespace to draw a standalone SVG.
  .transform((v) => (v.startsWith("<svg") && !/xmlns=/.test(v) ? v.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"') : v) || null);

// Trigger messages (P0001) are written for people; anything else is not.
function fail(error: { code?: string; message: string }, fallback: string): RoadmapState {
  if (error.code === "P0001") return { error: error.message };
  if (error.code === "23505") return { error: "Slug sudah dipakai roadmap lain." };
  return { error: fallback };
}

function done() {
  invalidateContent();
  refresh();
}

// A roadmap node as "Judul kelas (slug)" for log rows.
async function nodeName(nodeId: string) {
  const { data } = await (await createClient()).from("track_nodes").select("optional, topics(title, slug), tracks(title, slug)").eq("id", nodeId).maybeSingle();
  const t = data?.topics as unknown as { title: string; slug: string } | null;
  const tr = data?.tracks as unknown as { title: string; slug: string } | null;
  return { kelas: t ? `${t.title} (${t.slug})` : nodeId, track: tr?.slug ?? "", trackTitle: tr?.title ?? "", optional: !!data?.optional };
}

export async function buatTrack(_: RoadmapState, form: FormData): Promise<RoadmapState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ slug, title: z.string().trim().min(1, "Judul wajib diisi."), description: z.string().trim(), icon })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await (await createClient()).from("tracks").insert(parsed.data);
  if (error) return fail(error, "Gagal membuat track.");
  await audit(admin, "Buat roadmap", parsed.data.title, [["Judul", parsed.data.title], ["Slug", parsed.data.slug], ["Deskripsi", parsed.data.description], ["Halaman admin", `/admin/roadmap/${parsed.data.slug}`]]);
  redirect(`/admin/roadmap/${parsed.data.slug}`);
}

export async function simpanTrack(_: RoadmapState, form: FormData): Promise<RoadmapState> {
  const admin = await requireAdmin();
  const track = slug.parse(form.get("track"));
  const parsed = z
    .object({ title: z.string().trim().min(1, "Judul wajib diisi."), description: z.string().trim(), icon, slug: slug.optional() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const db = await createClient();
  const { data: old } = await db.from("tracks").select("title, description").eq("slug", track).maybeSingle();
  const { error } = await db.from("tracks").update({ ...parsed.data, slug: parsed.data.slug ?? track }).eq("slug", track);
  if (error) return fail(error, "Gagal menyimpan.");
  const now = parsed.data.slug ?? track;
  await audit(admin, "Simpan roadmap", parsed.data.title, [
    ["Judul", old && old.title !== parsed.data.title ? `${old.title} -> ${parsed.data.title}` : parsed.data.title],
    ["Slug", now !== track ? `${track} -> ${now}` : track],
    ["Deskripsi", old && old.description !== parsed.data.description ? `${old.description || "(kosong)"}\n-> ${parsed.data.description || "(kosong)"}` : parsed.data.description],
    ["Ikon", parsed.data.icon ? (parsed.data.icon.startsWith("<svg") ? "SVG khusus" : parsed.data.icon) : "Otomatis"],
    ["Halaman admin", `/admin/roadmap/${now}`],
  ]);
  invalidateContent();
  // The admin page lives at the slug: follow it.
  if (parsed.data.slug && parsed.data.slug !== track) redirect(`/admin/roadmap/${parsed.data.slug}`);
  done();
  return { ok: "Tersimpan." };
}

export async function tambahNode(_: RoadmapState, form: FormData): Promise<RoadmapState> {
  const admin = await requireAdmin();
  const track = slug.parse(form.get("track"));
  const db = await createClient();
  const { data: t } = await db.from("tracks").select("id, track_nodes(position)").eq("slug", track).single();
  if (!t) return { error: "Track tidak ditemukan." };

  const { data: node, error } = await db.from("track_nodes").insert({
    track_id: t.id,
    topic_id: id.parse(form.get("topic_id")),
    // After the last one, not the count: deleted nodes leave gaps.
    position: Math.max(-1, ...t.track_nodes.map((n) => n.position)) + 1,
  }).select("id, position").single();
  if (error) return fail(error, "Gagal menambah topik.");
  const n = await nodeName(node.id);
  await audit(admin, "Tambah kelas ke roadmap", `${n.kelas} di ${track}`, [["Roadmap", n.trackTitle], ["Kelas", n.kelas], ["Urutan", String(node.position + 1)], ["Status", "Draf sampai roadmap diterbitkan lagi"], ["Halaman admin", `/admin/roadmap/${track}`]]);
  done();
  return {};
}

export async function simpanNode(_: RoadmapState, form: FormData): Promise<RoadmapState> {
  const admin = await requireAdmin();
  const nodeId = id.parse(form.get("id"));
  const position = z.coerce.number().int().min(0).parse(form.get("position"));
  const optional = form.get("optional") === "on";
  const n = await nodeName(nodeId);
  const { error } = await (await createClient())
    .from("track_nodes")
    .update({
      position,
      optional,
      // An edit goes live only when the track is published again.
      status: "draft",
    })
    .eq("id", nodeId);
  if (error) return fail(error, "Gagal menyimpan topik.");
  await audit(admin, "Simpan kelas di roadmap", `${n.kelas} di ${n.track}`, [["Roadmap", n.trackTitle], ["Kelas", n.kelas], ["Posisi", String(position)], ["Opsional", optional === n.optional ? (optional ? "Ya" : "Tidak") : `${n.optional ? "Ya" : "Tidak"} -> ${optional ? "Ya" : "Tidak"}`], ["Halaman admin", `/admin/roadmap/${n.track}`]]);
  done();
  return {};
}

export async function tambahEdge(_: RoadmapState, form: FormData): Promise<RoadmapState> {
  const admin = await requireAdmin();
  const from = id.parse(form.get("from"));
  const to = id.parse(form.get("to"));
  const { error } = await (await createClient()).from("track_edges").insert({ from_node_id: from, to_node_id: to });
  if (error) return fail(error, "Gagal menambah prasyarat.");
  const [a, b] = await Promise.all([nodeName(from), nodeName(to)]);
  await audit(admin, "Tambah prasyarat roadmap", `${a.kelas} -> ${b.kelas}`, [["Roadmap", a.trackTitle], ["Kelas prasyarat", a.kelas], ["Sebelum kelas", b.kelas], ["Halaman admin", `/admin/roadmap/${a.track}`]]);
  done();
  return {};
}

// Deletes take effect right away, also on the published roadmap.
export async function hapus(_: RoadmapState, form: FormData): Promise<RoadmapState> {
  const admin = await requireAdmin();
  const table = z.enum(["track_nodes", "track_edges"]).parse(form.get("table"));
  const rowId = id.parse(form.get("id"));
  const db = await createClient();
  // Read what goes before it goes, so the log can name it.
  let action: string, detail: string, meta: Meta;
  if (table === "track_nodes") {
    const n = await nodeName(rowId);
    [action, detail, meta] = ["Hapus kelas dari roadmap", `${n.kelas} dari ${n.track}`, [["Roadmap", n.trackTitle], ["Kelas", n.kelas], ["Catatan", "Prasyarat yang terhubung ikut terhapus"], ["Halaman admin", `/admin/roadmap/${n.track}`]]];
  } else {
    const { data: e } = await db.from("track_edges").select("from_node_id, to_node_id").eq("id", rowId).maybeSingle();
    const [a, b] = e ? await Promise.all([nodeName(e.from_node_id), nodeName(e.to_node_id)]) : [null, null];
    [action, detail, meta] = ["Hapus prasyarat roadmap", a && b ? `${a.kelas} -> ${b.kelas}` : rowId, [["Roadmap", a?.trackTitle ?? ""], ["Kelas prasyarat", a?.kelas ?? ""], ["Sebelum kelas", b?.kelas ?? ""], ["Halaman admin", a ? `/admin/roadmap/${a.track}` : ""]]];
  }
  const { error } = await db.from(table).delete().eq("id", rowId);
  if (error) return fail(error, "Gagal menghapus.");
  await audit(admin, action, detail, meta);
  done();
  return {};
}

// What a log row says about a roadmap, read before the change.
async function trackMeta(track: string): Promise<Meta> {
  const { data } = await (await createClient()).from("tracks").select("title, status, track_nodes(id)").eq("slug", track).maybeSingle();
  return [["Judul", data?.title ?? ""], ["Slug", track], ["Status sebelumnya", data?.status ?? ""], ["Jumlah kelas", String(data?.track_nodes?.length ?? 0)]];
}

export async function terbitkanTrack(track: string): Promise<RoadmapState> {
  const admin = await requireAdmin();
  const meta = await trackMeta(slug.parse(track));
  const { error } = await (await createClient()).rpc("publish_track", { p_slug: slug.parse(track) });
  if (error) return fail(error, "Gagal menerbitkan.");
  await audit(admin, "Terbitkan roadmap", track, [...meta, ["Halaman publik", `/roadmap/${track}`], ["Halaman admin", `/admin/roadmap/${track}`]]);
  done();
  return { ok: "Roadmap diterbitkan." };
}

export async function tarikTrack(track: string): Promise<RoadmapState> {
  const admin = await requireAdmin();
  const meta = await trackMeta(slug.parse(track));
  const { error } = await (await createClient()).from("tracks").update({ status: "draft" }).eq("slug", slug.parse(track));
  if (error) return fail(error, "Gagal menarik roadmap.");
  await audit(admin, "Tarik roadmap", track, [...meta, ["Halaman admin", `/admin/roadmap/${track}`]]);
  done();
  return { ok: "Roadmap ditarik, tidak tampil di publik." };
}

export async function hapusTrack(track: string): Promise<RoadmapState> {
  const admin = await requireAdmin();
  const meta = await trackMeta(slug.parse(track));
  const { error } = await (await createClient()).from("tracks").delete().eq("slug", slug.parse(track));
  if (error) return fail(error, "Gagal menghapus roadmap.");
  await audit(admin, "Hapus roadmap", track, meta);
  invalidateContent();
  redirect("/admin/roadmap");
}
