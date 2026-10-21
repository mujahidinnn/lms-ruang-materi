// Runs in GitHub Actions only: pptx -> AVIF slides + AI draft.
//   node worker/import-deck.ts --job-id <uuid>
// Logs only job id, counts, timings and error class. Never deck content or
// model output: Actions logs are public.

import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { isAllowedModel } from "../lib/llm.ts";
import { providers } from "./llm/index.ts";
import { ProviderError } from "./llm/types.ts";
import {
  assembleDraft,
  buildChapterPrompt,
  buildClassPrompt,
  buildFixPrompt,
  chapterJsonSchema,
  chapterSchema,
  classJsonSchema,
  classSchema,
  exerciseJsonSchema,
  exerciseSchema,
  failingChecks,
  repairChapter,
  repairClass,
  validateExercises,
  type ChapterOut,
  type Draft,
} from "./prompt.ts";

const run = promisify(execFile);
const jobId = process.argv[process.argv.indexOf("--job-id") + 1] ?? "";
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(jobId)) {
  console.error("invalid --job-id");
  process.exit(1);
}

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const t0 = Date.now();
const log = (msg: string) => console.log(`[${jobId}] ${msg} +${Math.round((Date.now() - t0) / 1000)}s`);

function maybe<T>({ data, error }: { data: T | null; error: { message: string } | null }, what: string): T | null {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  const data = maybe(res, what);
  if (data === null) throw new Error(`${what}: no data`);
  return data;
}

// Claim: only a queued job, so a replayed dispatch does nothing.
type Job = { id: string; slug: string; file_path: string; provider: string; model: string };

const job = maybe<Job>(
  await db.from("import_jobs").update({ status: "rendering" }).eq("id", jobId).eq("status", "queued").select().maybeSingle(),
  "claim"
);
if (!job) {
  log("not queued, exiting");
  process.exit(0);
}

const work = await mkdtemp(path.join(tmpdir(), "import-"));
try {
  if (!isAllowedModel(job.provider, job.model)) throw new Error(`model not allowed: ${job.provider}/${job.model}`);

  const pptx = must(await db.storage.from("imports").download(job.file_path), "download");
  await writeFile(path.join(work, "deck.pptx"), Buffer.from(await pptx.arrayBuffer()));

  const slides = await render(work, `${job.slug}/${job.id}`);
  log(`rendered ${slides.length} slides`);

  maybe(await db.from("import_jobs").update({ status: "drafting" }).eq("id", jobId), "status drafting");
  const pdf = await readFile(path.join(work, "deck.pdf"));
  const known = must(await db.from("topics").select("slug"), "slugs").map((t) => t.slug).filter((s) => s !== job.slug);
  const generate = await providers[job.provider]();
  const current = maybe(await db.from("chapters").select("slug, title, topics!inner(slug)").eq("topics.slug", job.slug).eq("status", "published").order("position"), "current chapters") ?? [];
  const tokens = { in: 0, out: 0 };
  const call = async (prompt: Parameters<typeof generate>[1], schema: unknown) => {
    const r = await generate(pdf, prompt, job.model, schema);
    tokens.in += r.inputTokens;
    tokens.out += r.outputTokens;
    return r.output;
  };

  // Stage 1: the class and its outline.
  const cls = classSchema.safeParse(repairClass(await call(buildClassPrompt(known, current), classJsonSchema), slides.length));
  if (!cls.success) {
    // Paths and codes only, no values.
    const where = cls.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}:${i.code}`).join(", ");
    throw Object.assign(new Error(`output tidak valid (${where})`), { name: "SchemaError" });
  }
  log(`outline: ${cls.data.outline.length} chapters`);

  // Stage 2: each chapter on its own, one retry; a chapter that still fails
  // is left out (assembleDraft needs at least 4).
  const chapters: (ChapterOut | null)[] = [];
  for (const i of cls.data.outline.keys()) {
    let got: ChapterOut | null = null;
    for (let attempt = 0; attempt < 2 && !got; attempt++) {
      try {
        const r = chapterSchema.safeParse(repairChapter(await call(buildChapterPrompt(cls.data.title, cls.data.outline, i), chapterJsonSchema)));
        if (r.success) got = r.data;
      } catch (e) {
        if (!(e instanceof ProviderError)) throw e;
      }
    }
    log(`chapter ${i + 1}/${cls.data.outline.length}: ${got ? "ok" : "dropped"}`);
    chapters.push(got);
  }

  // One repair call for an exercise whose solution fails its own checks.
  const fix = async (e: Parameters<typeof buildFixPrompt>[0], failing: string[]) => {
    const r = exerciseSchema.safeParse(await call(buildFixPrompt(e, failing), exerciseJsonSchema).catch(() => null));
    return r.success ? r.data : null;
  };
  const draft = await validateExercises(assembleDraft(cls.data, chapters), fix);
  const projectVerified = !!draft.project && draft.project.kind !== "web" && !(await failingChecks(draft.project)).length;

  await writeDraft(job.slug, draft, slides, projectVerified);
  maybe(
    await db
      .from("import_jobs")
      .update({
        status: "done",
        input_tokens: tokens.in,
        output_tokens: tokens.out,
        prerequisites: draft.prerequisites.filter((s) => known.includes(s)),
      })
      .eq("id", jobId),
    "status done"
  );
  log(`done, ${draft.chapters.length} chapters, ${tokens.in} in / ${tokens.out} out tokens`);
} catch (err) {
  const e = err as Error;
  log(`failed: ${e.name}`);
  await db.from("import_jobs").update({ status: "failed", error: `${e.name}: ${e.message}`.slice(0, 500) }).eq("id", jobId);
  process.exitCode = 1;
} finally {
  await rm(work, { recursive: true, force: true });
  if (job.provider === "gemini-web") await (await import("./llm/gemini-web.ts")).closeGeminiWeb();
}

type RenderedSlide = { index: number; path: string; width: number; height: number };

async function render(dir: string, folder: string): Promise<RenderedSlide[]> {
  await run("soffice", ["--headless", "--convert-to", "pdf", "--outdir", dir, path.join(dir, "deck.pptx")], {
    timeout: 5 * 60 * 1000,
  });
  await run("pdftoppm", ["-png", "-scale-to", "3200", path.join(dir, "deck.pdf"), path.join(dir, "p")], {
    timeout: 5 * 60 * 1000,
  });

  const pngs = (await readdir(dir)).filter((f) => /^p-\d+\.png$/.test(f)).sort();
  if (pngs.length === 0 || pngs.length > 80) throw new Error(`slide count ${pngs.length} outside 1..80`);

  const out: RenderedSlide[] = [];
  for (const [i, png] of pngs.entries()) {
    const nn = String(i + 1).padStart(2, "0");
    const img = sharp(path.join(dir, png));
    const { width, height } = await img.metadata();
    const files: [string, Buffer][] = [
      [`slide-${nn}.avif`, await img.clone().avif({ quality: 60, effort: 4 }).toBuffer()],
      // Phones and laptops get this one; the 3200px file is for big screens.
      [`slide-${nn}-1600.avif`, await img.clone().resize({ width: 1600 }).avif({ quality: 60, effort: 4 }).toBuffer()],
      [`thumb-${nn}.avif`, await img.clone().resize({ width: 400 }).avif({ quality: 55, effort: 4 }).toBuffer()],
    ];
    if (i === 0) files.push(["cover.avif", await img.clone().resize({ width: 1280 }).avif({ quality: 60, effort: 4 }).toBuffer()]);

    for (const [name, buf] of files) {
      must(
        await db.storage.from("slides").upload(`${folder}/${name}`, buf, { contentType: "image/avif", upsert: true, cacheControl: "31536000" }),
        `upload ${name}`
      );
    }
    out.push({ index: i + 1, path: `${folder}/slide-${nn}.avif`, width: width!, height: height! });
  }
  return out;
}

// ponytail: several writes without a transaction. A crash leaves partial
// drafts, which the next import of the same slug replaces. Move into one
// RPC if that ever bites.
async function writeDraft(slug: string, d: Draft, slides: RenderedSlide[], projectVerified: boolean) {
  let topic = maybe<{ id: string }>(await db.from("topics").select("id").eq("slug", slug).maybeSingle(), "topic");
  if (topic) {
    maybe(await db.from("topics").update({ draft_summary: d.summary }).eq("id", topic.id), "topic update");
  } else {
    topic = must<{ id: string }>(
      await db
        .from("topics")
        .insert({ slug, title: d.title, description: d.description, draft_summary: d.summary, status: "draft" })
        .select("id")
        .single(),
      "topic insert"
    );
  }
  const topic_id = topic.id;

  for (const table of ["slides", "tips", "flashcards", "practice_questions", "chapters", "projects"]) {
    maybe(await db.from(table).delete().eq("topic_id", topic_id).eq("status", "draft"), `clear ${table}`);
  }
  let exam = maybe<{ id: string }>(await db.from("exams").select("id").eq("topic_id", topic_id).maybeSingle(), "exam");
  exam ??= must<{ id: string }>(await db.from("exams").insert({ topic_id, status: "draft" }).select("id").single(), "exam insert");
  const examId = exam.id;
  maybe(await db.from("exam_questions").delete().eq("exam_id", examId).eq("status", "draft"), "clear exam_questions");

  const q = ({ code, ...rest }: Draft["exam_questions"][number]) => ({ ...rest, code: code.trim() || null, status: "draft" });

  maybe(await db.from("slides").insert(slides.map((s) => ({ ...s, topic_id, status: "draft" }))), "slides");
  maybe(await db.from("tips").insert(d.tips.map((body, position) => ({ topic_id, body, position, status: "draft" }))), "tips");
  maybe(
    await db.from("flashcards").insert(d.flashcards.map((f, position) => ({ topic_id, ...f, position, status: "draft" }))),
    "flashcards"
  );
  maybe(await db.from("practice_questions").insert(d.practice_questions.map((x) => ({ topic_id, ...q(x) }))), "practice");
  maybe(await db.from("exam_questions").insert(d.exam_questions.map((x) => ({ exam_id: examId, ...q(x) }))), "exam questions");

  // Models sometimes repeat a slug; the (topic, status, slug) key is unique.
  const seen = new Set<string>();
  for (const [position, c] of d.chapters.entries()) {
    let slug = c.slug;
    for (let n = 2; seen.has(slug); n++) slug = `${c.slug}-${n}`;
    seen.add(slug);
    const row = must<{ id: string }>(
      await db
        .from("chapters")
        .insert({ topic_id, position, slug, title: c.title, body: c.body, est_minutes: c.est_minutes, slide_from: c.slide_from, slide_to: c.slide_to, status: "draft" })
        .select("id")
        .single(),
      `chapter ${slug}`
    );
    maybe(
      await db.from("chapter_questions").insert(
        c.quiz.map(({ code, ...rest }, qi) => ({ chapter_id: row.id, position: qi, ...rest, code: code.trim() || null }))
      ),
      `chapter ${slug} quiz`
    );
    if (c.exercises.length) {
      maybe(
        await db.from("code_exercises").insert(c.exercises.map((e, ei) => ({ chapter_id: row.id, position: ei, ...e }))),
        `chapter ${slug} exercises`
      );
    }
  }
  if (d.project) {
    const { solution, ...rest } = d.project;
    const row = must<{ id: string }>(
      await db
        .from("projects")
        .insert({ topic_id, status: "draft", ...rest, verified_at: projectVerified ? new Date().toISOString() : null })
        .select("id")
        .single(),
      "project"
    );
    maybe(await db.from("project_solutions").insert({ project_id: row.id, solution }), "project solution");
  }
}
