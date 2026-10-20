import { invalidateContent } from "@/lib/cache";
import { refresh } from "@/lib/request";
import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

// A textarea holding JSON, parsed and validated against the given schema.
const json = <T extends z.ZodType>(schema: T) =>
  z.string().transform((s, ctx) => {
    try {
      return schema.parse(JSON.parse(s)) as z.infer<T>;
    } catch {
      ctx.addIssue({ code: "custom", message: "JSON tidak valid" });
      return z.NEVER;
    }
  });
const files = z.object({ html: z.string().optional(), css: z.string().optional(), js: z.string().optional(), code: z.string().optional() });
const tests = z.array(z.object({ name: z.string().min(1), check: z.string().min(1) }));

function done(topic: string) {
  invalidateContent();
  refresh();
}

export async function simpanLatihanKode(form: FormData) {
  await requireAdmin();
  const { id, topic, ...row } = z
    .object({
      id: z.uuid(),
      topic: z.string(),
      title: z.string().trim().min(1).max(120),
      kind: z.enum(["web", "js", "express"]),
      prompt: z.string().min(1),
      starter: json(files),
      solution: json(files),
      setup: z.string(),
      tests: json(tests),
    })
    .parse(Object.fromEntries(form));
  const { error } = await (await createClient()).from("code_exercises").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  done(topic);
}

export async function tambahLatihanKode(form: FormData) {
  await requireAdmin();
  const { chapter, topic } = z.object({ chapter: z.uuid(), topic: z.string() }).parse(Object.fromEntries(form));
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
  done(topic);
}

export async function hapusLatihanKode(form: FormData) {
  await requireAdmin();
  const { id, topic } = z.object({ id: z.uuid(), topic: z.string() }).parse(Object.fromEntries(form));
  const { error } = await (await createClient()).from("code_exercises").delete().eq("id", id);
  if (error) throw new Error(error.message);
  done(topic);
}
