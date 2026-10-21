import { invalidateContent } from "@/lib/cache";
import { refresh } from "@/lib/request";
import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { files, json, tests } from "@/lib/admin-forms";
import { createClient } from "@/lib/supabase/server";

function done() {
  invalidateContent();
  refresh();
}

export async function simpanLatihanKode(form: FormData) {
  await requireAdmin();
  const { id, topic: _topic, ...row } = z
    .object({
      id: z.uuid(),
      topic: z.string(),
      title: z.string().trim().min(1).max(120),
      kind: z.enum(["web", "js", "express", "python"]),
      prompt: z.string().min(1),
      starter: json(files),
      solution: json(files),
      setup: z.string(),
      tests: json(tests),
    })
    .parse(Object.fromEntries(form));
  const { error } = await (await createClient()).from("code_exercises").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  done();
}

export async function tambahLatihanKode(form: FormData) {
  await requireAdmin();
  const { chapter, topic: _topic } = z.object({ chapter: z.uuid(), topic: z.string() }).parse(Object.fromEntries(form));
  const { error } = await (await createClient()).from("code_exercises").insert({
    chapter_id: chapter,
    kind: "js",
    title: "Latihan baru",
    prompt: "Tulis instruksinya di sini.",
    starter: { code: "" },
    solution: { code: "" },
    tests: [],
  });
  if (error) throw new Error(error.message);
  done();
}

export async function hapusLatihanKode(form: FormData) {
  await requireAdmin();
  const { id, topic: _topic } = z.object({ id: z.uuid(), topic: z.string() }).parse(Object.fromEntries(form));
  const { error } = await (await createClient()).from("code_exercises").delete().eq("id", id);
  if (error) throw new Error(error.message);
  done();
}
