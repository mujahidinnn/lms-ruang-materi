// Loads a Studio Proyek project from content/studio/<slug>.json into the
// database (service role). Safe to run again: the project is updated and its
// steps are replaced. Learners' ticks survive because they point at check ids.
//
//   node --env-file=.env.local scripts/seed-studio.mjs portofolio [--publish]
import { readFile } from "node:fs/promises";

const slug = process.argv[2];
if (!slug) throw new Error("usage: seed-studio.mjs <slug> [--publish]");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" };
const api = async (path, init) => {
  const r = await fetch(`${url}/rest/v1/${path}`, { headers: H, ...init });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${path}: ${r.status} ${JSON.stringify(body)}`);
  return body;
};

const p = JSON.parse(await readFile(new URL(`../content/studio/${slug}.json`, import.meta.url), "utf8"));
const existing = (await api(`studio_defs?slug=eq.${slug}&select=id,status`))[0];
const status = process.argv.includes("--publish") ? "published" : (existing?.status ?? "draft");
const row = { slug, title: p.title, summary: p.summary, level: p.level, est_hours: p.est_hours, status, updated_at: new Date().toISOString() };
const def = existing
  ? (await api(`studio_defs?id=eq.${existing.id}`, { method: "PATCH", body: JSON.stringify(row) }))[0]
  : (await api("studio_defs", { method: "POST", body: JSON.stringify(row) }))[0];
await api(`studio_steps?def_id=eq.${def.id}`, { method: "DELETE" });
await api("studio_steps", { method: "POST", body: JSON.stringify(p.steps.map((s, i) => ({ def_id: def.id, position: i, ...s }))) });
console.log(`${slug}: ${p.steps.length} langkah, status ${status}`);
