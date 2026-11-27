import { invalidateContent } from "@/lib/cache";
import { refresh } from "@/lib/request";
import { z } from "zod";
import { newChapterStatus } from "@/lib/chapters";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const slug = z.string().regex(/^[a-z0-9-]+$/).refine((s) => s !== "slide", "slug slide dipakai halaman slide");
const optionalSlide = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(1).nullable());

function done() {
  invalidateContent();
  refresh();
}

export async function simpanBab(form: FormData) {
  const admin = await requireAdmin();
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
  const db = await createClient();
  const { data: old } = await db.from("chapters").select("title, slug, status").eq("id", id).maybeSingle();
  const { error } = await db.from("chapters").update(row).eq("id", id);
  if (error?.code === "23505") throw new Error("Slug sudah dipakai bab lain di kelas ini.");
  if (error) throw new Error(error.message);
  await audit(admin, "Simpan bab", `${row.title} (${topic})`, [
    ["Kelas", topic],
    ["Judul", old && old.title !== row.title ? `${old.title} -> ${row.title}` : row.title],
    ["Slug", old && old.slug !== row.slug ? `${old.slug} -> ${row.slug}` : row.slug],
    ["Status", old?.status ?? ""],
    ["Perkiraan", `${row.est_minutes} menit`],
    ["Slide", row.slide_from ? `${row.slide_from} sampai ${row.slide_to ?? row.slide_from}` : "Tanpa slide"],
    ["Panjang isi", `${row.body.length.toLocaleString("id-ID")} karakter`],
    ["Halaman admin", `/admin/topik/${topic}`],
  ]);
  done();
}

// See newChapterStatus: drafts unless the topic already has live chapters.
export async function tambahBab(form: FormData) {
  const admin = await requireAdmin();
  const { topic } = z.object({ topic: z.string() }).parse(Object.fromEntries(form));
  const db = await createClient();
  const { data: t } = await db.from("topics").select("id, chapters(status, position)").eq("slug", topic).single();
  if (!t) throw new Error("topik tidak ditemukan");
  const rows = t.chapters as { status: string; position: number }[];
  const status = newChapterStatus(rows);
  const position = Math.max(-1, ...rows.filter((c) => c.status === status).map((c) => c.position)) + 1;
  const { error } = await db.from("chapters").insert({
    topic_id: t.id, status, position, slug: `bab-${position + 1}`, title: `Bab ${position + 1}`, body: "Tulis isi bab di sini.",
  });
  if (error) throw new Error(error.message);
  await audit(admin, "Tambah bab", `Bab ${position + 1} (${topic})`, [["Kelas", topic], ["Judul", `Bab ${position + 1}`], ["Status", status], ["Halaman admin", `/admin/topik/${topic}`]]);
  done();
}

export async function hapusBab(form: FormData) {
  const admin = await requireAdmin();
  const { id, topic } = z.object({ id: z.uuid(), topic: z.string() }).parse(Object.fromEntries(form));
  const db = await createClient();
  const { data: old } = await db.from("chapters").select("title, slug, status, est_minutes").eq("id", id).maybeSingle();
  const { error } = await db.from("chapters").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await audit(admin, "Hapus bab", `${old?.title ?? id} (${topic})`, [["Kelas", topic], ["Judul", old?.title ?? ""], ["Slug", old?.slug ?? ""], ["Status", old?.status ?? ""], ["Perkiraan", old ? `${old.est_minutes} menit` : ""], ["Halaman admin", `/admin/topik/${topic}`]]);
  done();
}

// Swaps positions with the neighbour; the unique key is deferred.
export async function geserBab(form: FormData) {
  const admin = await requireAdmin();
  const { id, topic, arah } = z.object({ id: z.uuid(), topic: z.string(), arah: z.enum(["naik", "turun"]) }).parse(Object.fromEntries(form));
  const db = await createClient();
  const { data: c } = await db.from("chapters").select("topic_id, status, position, title").eq("id", id).single();
  if (!c) throw new Error("bab tidak ditemukan");
  const { data: other } = await db
    .from("chapters")
    .select("id, position, title")
    .eq("topic_id", c.topic_id)
    .eq("status", c.status)
    .order("position", { ascending: arah === "turun" })
    .filter("position", arah === "naik" ? "lt" : "gt", c.position)
    .limit(1)
    .maybeSingle();
  if (!other) return;
  const { error } = await db.rpc("swap_chapters", { a: id, b: other.id });
  if (error) throw new Error(error.message);
  await audit(admin, "Geser bab", `${c.title} ${arah} (${topic})`, [["Kelas", topic], ["Bab", c.title], ["Arah", arah], ["Bertukar dengan", other.title], ["Urutan", `${c.position + 1} -> ${other.position + 1}`], ["Halaman admin", `/admin/topik/${topic}`]]);
  done();
}
