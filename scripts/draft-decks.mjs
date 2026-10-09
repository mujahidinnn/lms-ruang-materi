// Drafts migrated decks (imports/migrasi/<slug>.pptx) one at a time, the
// same way /admin/impor does: as the dev admin, insert an import_jobs row,
// dispatch the workflow, wait until it is done or failed. Publishing stays a
// human step in /admin/topik.
//
//   npm run draft:decks -- javascript reactjs
//   IMPORT_MODEL=openrouter:nvidia/nemotron-3-super-120b-a12b:free npm run draft:decks -- sql
//
// The database allows 10 jobs per 24 hours, failed ones included.
import { createClient } from "@supabase/supabase-js";
import { countSlides } from "../lib/pptx.ts";

const env = process.env;
const [provider, model] = (env.IMPORT_MODEL ?? `${env.LLM_PROVIDER}:${env.LLM_MODEL}`).split(/:(.*)/);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const { error: loginError } = await db.auth.signInWithPassword({ email: env.DEV_ADMIN_EMAIL, password: env.DEV_ADMIN_PASSWORD });
if (loginError) throw new Error(`login: ${loginError.message}`);

async function dispatch(jobId) {
  for (let tries = 0; tries < 5; tries++) {
    if (tries) await sleep(10_000);
    const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/import-deck.yml/dispatches`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.GITHUB_DISPATCH_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      body: JSON.stringify({ ref: "main", inputs: { job_id: jobId } }),
    }).catch(() => null);
    if (res?.ok) return true;
  }
  return false;
}

for (const slug of process.argv.slice(2)) {
  const filePath = `migrasi/${slug}.pptx`;
  const { data: file, error: dlError } = await db.storage.from("imports").download(filePath);
  if (dlError) {
    log(slug, "unduh gagal:", dlError.message);
    continue;
  }
  const id = crypto.randomUUID();
  const slides = countSlides(new Uint8Array(await file.arrayBuffer()));
  const { error } = await db.from("import_jobs").insert({ id, file_path: filePath, original_name: `${slug}.pptx`, slug, provider, model, slide_count: slides });
  if (error) {
    log(slug, "job ditolak:", error.message);
    break;
  }
  // A job left queued would block the next import for 30 minutes.
  if (!(await dispatch(id))) {
    await db.from("import_jobs").delete().eq("id", id);
    log(slug, "dispatch ke GitHub gagal");
    break;
  }
  log(slug, `mulai, ${slides} slide, ${provider}:${model}`);
  for (let t = 0; t < 120; t++) {
    await sleep(15_000);
    const { data } = await db.from("import_jobs").select("status, error").eq("id", id).single();
    if (data?.status === "done" || data?.status === "failed") {
      log(slug, data.status, (data.error ?? "").slice(0, 160));
      break;
    }
  }
}
