"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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
} as const;

type Table = keyof typeof schemas;

function done(slug: string) {
  updateTag("content");
  revalidatePath(`/admin/topik/${slug}`);
}

export async function simpanBaris(formData: FormData) {
  await requireAdmin();
  const table = String(formData.get("table")) as Table;
  const schema = schemas[table];
  if (!schema) throw new Error("tabel tidak dikenal");
  const id = z.uuid().parse(formData.get("id"));
  const slug = String(formData.get("slug"));
  const fields = schema.parse({ ...Object.fromEntries(formData), options: formData.getAll("options") });

  const { error } = await (await createClient()).from(table).update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  done(slug);
}

export async function hapusBaris(formData: FormData) {
  await requireAdmin();
  const table = String(formData.get("table")) as Table;
  if (!schemas[table]) throw new Error("tabel tidak dikenal");
  const id = z.uuid().parse(formData.get("id"));

  const { error } = await (await createClient()).from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  done(String(formData.get("slug")));
}

export async function simpanRingkasan(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug"));
  const { error } = await (await createClient())
    .from("topics")
    .update({ draft_summary: text.parse(formData.get("summary")) })
    .eq("slug", slug);
  if (error) throw new Error(error.message);
  done(slug);
}

export type TopikState = { error?: string; ok?: string };

export async function terbitkan(slug: string): Promise<TopikState> {
  await requireAdmin();
  const { error } = await (await createClient()).rpc("publish_topic", { p_slug: slug });
  if (error) return { error: error.code === "P0001" ? error.message : "Gagal menerbitkan." };
  done(slug);
  return { ok: "Topik diterbitkan." };
}

export async function tarik(slug: string): Promise<TopikState> {
  await requireAdmin();
  const { error } = await (await createClient()).from("topics").update({ status: "draft" }).eq("slug", slug);
  if (error) return { error: "Gagal menarik topik." };
  done(slug);
  return { ok: "Topik ditarik, tidak tampil di publik." };
}

// ponytail: slide files stay in Storage after delete. Add a cleanup when
// storage cost matters.
export async function hapusTopik(slug: string): Promise<TopikState> {
  await requireAdmin();
  const { error } = await (await createClient()).from("topics").delete().eq("slug", slug);
  if (error) return { error: "Gagal menghapus topik." };
  updateTag("content");
  redirect("/admin/topik");
}
