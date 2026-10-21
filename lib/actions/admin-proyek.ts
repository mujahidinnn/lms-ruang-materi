import { invalidateContent } from "@/lib/cache";
import { refresh } from "@/lib/request";
import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { files, json, tests } from "@/lib/admin-forms";
import { createClient } from "@/lib/supabase/server";

// The topic's final project. Saving clears verified_at: the solution or the
// checks may have changed, so it needs "Uji solusi" again before learners
// see it (projects: read published).

function done() {
  invalidateContent();
  refresh();
}

export async function simpanProyek(form: FormData) {
  await requireAdmin();
  const { id, solution, ...row } = z
    .object({
      id: z.uuid(),
      title: z.string().trim().min(1).max(120),
      kind: z.enum(["web", "js", "express"]),
      brief: z.string(),
      prompt: z.string(),
      starter: json(files),
      solution: json(files),
      setup: z.string(),
      tests: json(tests),
    })
    .parse(Object.fromEntries(form));
  const db = await createClient();
  const { error } = await db.from("projects").update({ ...row, verified_at: null }).eq("id", id);
  if (error) throw new Error(error.message);
  const { error: e2 } = await db.from("project_solutions").upsert({ project_id: id, solution });
  if (e2) throw new Error(e2.message);
  done();
}

// A new project takes the topic's status, hidden until verified.
export async function tambahProyek(form: FormData) {
  await requireAdmin();
  const { topic } = z.object({ topic: z.string() }).parse(Object.fromEntries(form));
  const db = await createClient();
  const { data: t } = await db.from("topics").select("id, status").eq("slug", topic).single();
  if (!t) throw new Error("topik tidak ditemukan");
  const { data: row, error } = await db
    .from("projects")
    .insert({ topic_id: t.id, status: t.status === "published" ? "published" : "draft", kind: "js", title: "Proyek akhir", brief: "Tulis brief proyek di sini." })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await db.from("project_solutions").insert({ project_id: row.id, solution: {} });
  done();
}

export async function hapusProyek(form: FormData) {
  await requireAdmin();
  const { id } = z.object({ id: z.uuid() }).parse(Object.fromEntries(form));
  const { error } = await (await createClient()).from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  done();
}

// Called by the editor after "Uji solusi" passed in the browser sandbox.
export async function verifikasiProyek(id: string) {
  await requireAdmin();
  const { error } = await (await createClient()).from("projects").update({ verified_at: new Date().toISOString() }).eq("id", z.uuid().parse(id));
  if (error) throw new Error(error.message);
  done();
}
