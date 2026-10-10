// One-off: adds the 1600px slide-NN-1600.avif variant next to every slide
// rendered before the worker made it. Safe to re-run; existing variants are
// skipped. Needs SUPABASE_SERVICE_ROLE_KEY.
//
//   node --env-file=.env.local scripts/backfill-slide-variants.mjs
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: rows, error } = await db.from("slides").select("path");
if (error) throw error;

const variant = (p) => p.replace(/\.avif$/, "-1600.avif");
const folders = [...new Set(rows.map((r) => r.path.slice(0, r.path.lastIndexOf("/"))))];
const have = new Set();
for (const f of folders) {
  const { data } = await db.storage.from("slides").list(f, { limit: 1000 });
  for (const o of data ?? []) have.add(`${f}/${o.name}`);
}

// Storage calls flake now and then; six tries each.
async function retry(label, fn) {
  for (let i = 1; ; i++) {
    const { data, error } = await fn();
    if (!error) return data;
    if (i === 6) throw new Error(`${label}: ${error.message}`);
    await new Promise((r) => setTimeout(r, 3000 * i));
  }
}

let made = 0;
for (const { path } of rows) {
  if (have.has(variant(path))) continue;
  const file = await retry(path, () => db.storage.from("slides").download(path));
  const buf = await sharp(Buffer.from(await file.arrayBuffer())).resize({ width: 1600, withoutEnlargement: true }).avif({ quality: 60, effort: 4 }).toBuffer();
  await retry(path, () => db.storage.from("slides").upload(variant(path), buf, { contentType: "image/avif", upsert: true, cacheControl: "31536000" }));
  made++;
}
console.log(`${rows.length} slides, ${made} variants made`);
