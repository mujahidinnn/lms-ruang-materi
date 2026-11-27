import { invalidateContent } from "@/lib/cache";
import { redirect, refresh } from "@/lib/request";
import { z } from "zod";
import { audit, type Meta } from "@/lib/audit";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const text = z.string().trim().min(1);
const question = z.object({
  prompt: text,
  code: z.string().trim().transform((s) => s || null),
  options: z.array(text).min(2).max(4),
  answer: z.coerce.number().int().min(0).max(3),
  explanation: text,
});

// Editable tables and their fields. Anything else is rejected.
const schemas = {
  tips: z.object({ body: text }),
  flashcards: z.object({ front: text, back: text }),
  practice_questions: question,
  exam_questions: question,
  chapter_questions: question,
} as const;

type Table = keyof typeof schemas;

function done() {
  invalidateContent();
  refresh();
}

export async function simpanBaris(formData: FormData) {
  await requireAdmin();
  const table = String(formData.get("table")) as Table;
  const schema = schemas[table];
  if (!schema) throw new Error("tabel tidak dikenal");
  const id = z.uuid().parse(formData.get("id"));
  const fields = schema.parse({ ...Object.fromEntries(formData), options: formData.getAll("options") });

  const { error } = await (await createClient()).from(table).update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  done();
}

export async function hapusBaris(formData: FormData) {
  await requireAdmin();
  const table = String(formData.get("table")) as Table;
  if (!schemas[table]) throw new Error("tabel tidak dikenal");
  const id = z.uuid().parse(formData.get("id"));

  const slug = String(formData.get("slug"));
  const { error } = await (await createClient()).from(table).delete().eq("id", id);
  // A rule the database enforces (the 2x exam bank): say which, on the page.
  if (error?.code === "P0001") redirect(`/admin/topik/${slug}?galat=${encodeURIComponent(error.message)}`);
  if (error) throw new Error(error.message);
  done();
}

export async function simpanRingkasan(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug"));
  const { error } = await (await createClient())
    .from("topics")
    .update({ draft_summary: text.parse(formData.get("summary")) })
    .eq("slug", slug);
  if (error) throw new Error(error.message);
  done();
}

// Judul dan slug kelas. The admin page lives at the slug, so go there after.
export async function simpanTopik(_: TopikState, form: FormData): Promise<TopikState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ slug: z.string().regex(/^[a-z0-9-]+$/), baru: z.string().regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka dan tanda hubung.").max(60), title: z.string().trim().min(1, "Judul wajib diisi.").max(120) })
    .safeParse({ slug: form.get("topic"), baru: form.get("slug"), title: form.get("title") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const before = await topicMeta(parsed.data.slug);
  const { error } = await (await createClient()).rpc("rename_topic", { p_slug: parsed.data.slug, p_new: parsed.data.baru, p_title: parsed.data.title });
  if (error) return { error: error.code === "P0001" ? error.message : "Gagal menyimpan." };
  await audit(admin, "Ubah nama kelas", parsed.data.slug === parsed.data.baru ? parsed.data.slug : `${parsed.data.slug} -> ${parsed.data.baru}`, [
    ["Judul lama", before[0][1]],
    ["Judul baru", parsed.data.title],
    ["Slug lama", parsed.data.slug],
    ["Slug baru", parsed.data.baru],
    ["Halaman admin", `/admin/topik/${parsed.data.baru}`],
  ]);
  invalidateContent();
  if (parsed.data.baru !== parsed.data.slug) redirect(`/admin/topik/${parsed.data.baru}`);
  done();
  return { ok: "Tersimpan." };
}

export type TopikState = { error?: string; ok?: string };

// What a log row says about a class, read before the change.
async function topicMeta(slug: string): Promise<Meta> {
  const { data } = await (await createClient()).from("topics").select("title, status, chapters(status)").eq("slug", slug).maybeSingle();
  const ch = (data?.chapters ?? []) as { status: string }[];
  return [
    ["Judul", data?.title ?? ""],
    ["Slug", slug],
    ["Status sebelumnya", data?.status ?? ""],
    ["Bab", ch.length ? `${ch.length} bab (${ch.filter((c) => c.status === "published").length} terbit)` : "Belum ada bab"],
  ];
}

export async function terbitkan(slug: string): Promise<TopikState> {
  const admin = await requireAdmin();
  const meta = await topicMeta(slug);
  const { error } = await (await createClient()).rpc("publish_topic", { p_slug: slug });
  if (error) return { error: error.code === "P0001" ? error.message : "Gagal menerbitkan." };
  await audit(admin, "Terbitkan topik", slug, [...meta, ["Halaman publik", `/belajar/${slug}`], ["Halaman admin", `/admin/topik/${slug}`]]);
  done();
  return { ok: "Topik diterbitkan." };
}

export async function tarik(slug: string): Promise<TopikState> {
  const admin = await requireAdmin();
  const meta = await topicMeta(slug);
  const { error } = await (await createClient()).from("topics").update({ status: "draft" }).eq("slug", slug);
  if (error) return { error: "Gagal menarik topik." };
  await audit(admin, "Tarik topik", slug, [...meta, ["Halaman admin", `/admin/topik/${slug}`]]);
  done();
  return { ok: "Topik ditarik, tidak tampil di publik." };
}

// Slide files stay in Storage; scripts/sweep-slides.mjs removes folders no
// slides row points at.
export async function hapusTopik(slug: string): Promise<TopikState> {
  const admin = await requireAdmin();
  const meta = await topicMeta(slug);
  const { error } = await (await createClient()).from("topics").delete().eq("slug", slug);
  if (error) return { error: "Gagal menghapus topik." };
  await audit(admin, "Hapus topik", slug, meta);
  invalidateContent();
  redirect("/admin/topik");
}
