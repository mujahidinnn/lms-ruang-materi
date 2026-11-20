// Re-renders the published slides of class decks from content/decks/<slug>.json
// (scripts/deck-simple.py) into a new Storage folder and points the published
// `slides` rows at it. Slide count must match. Needs SUPABASE_SERVICE_ROLE_KEY.
//
//   node --env-file=.env.local scripts/restyle-decks.mjs [slug...]   (default: every content/decks/*.json)
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const root = new URL("../", import.meta.url).pathname;
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const slugs = process.argv.length > 2 ? process.argv.slice(2) : readdirSync(join(root, "content/decks")).map((f) => f.replace(/\.json$/, ""));
const stamp = `restyle-${Date.now().toString(36)}`;

async function retry(label, fn) {
  for (let i = 1; ; i++) {
    const { data, error } = await fn();
    if (!error) return data;
    if (i === 6) throw new Error(`${label}: ${error.message}`);
    await new Promise((r) => setTimeout(r, 3000 * i));
  }
}

for (const slug of slugs) {
  const dir = mkdtempSync(join(tmpdir(), "restyle-"));
  try {
    const { data: topic } = await db.from("topics").select("id").eq("slug", slug).single();
    const { data: rows } = await db.from("slides").select("index").eq("topic_id", topic.id).eq("status", "published");
    execFileSync("python3", ["deck-simple.py", join(root, `content/decks/${slug}.json`), join(dir, "deck.pptx")], { cwd: join(root, "scripts") });
    execFileSync("soffice", ["--headless", "--convert-to", "pdf", "--outdir", dir, join(dir, "deck.pptx")], { timeout: 300000 });
    execFileSync("pdftoppm", ["-png", "-scale-to", "3200", join(dir, "deck.pdf"), join(dir, "p")], { timeout: 300000 });
    const pngs = readdirSync(dir).filter((f) => /^p-\d+\.png$/.test(f)).sort();
    if (pngs.length !== rows.length) throw new Error(`${slug}: ${pngs.length} slide baru, ${rows.length} di database`);

    const folder = `${slug}/${stamp}`;
    const paths = [];
    for (const [i, png] of pngs.entries()) {
      const nn = String(i + 1).padStart(2, "0");
      const img = sharp(join(dir, png));
      const { width, height } = await img.metadata();
      const files = [
        [`slide-${nn}.avif`, await img.clone().avif({ quality: 60, effort: 4 }).toBuffer()],
        [`slide-${nn}-1600.avif`, await img.clone().resize({ width: 1600 }).avif({ quality: 60, effort: 4 }).toBuffer()],
        [`thumb-${nn}.avif`, await img.clone().resize({ width: 400 }).avif({ quality: 55, effort: 4 }).toBuffer()],
      ];
      if (i === 0) files.push(["cover.avif", await img.clone().resize({ width: 1280 }).avif({ quality: 60, effort: 4 }).toBuffer()]);
      await Promise.all(files.map(([name, buf]) => retry(name, () => db.storage.from("slides").upload(`${folder}/${name}`, buf, { contentType: "image/avif", upsert: true, cacheControl: "31536000" }))));
      paths.push({ index: i + 1, path: `${folder}/slide-${nn}.avif`, width, height });
    }
    for (const p of paths) await retry(`row ${p.index}`, () => db.from("slides").update({ path: p.path, width: p.width, height: p.height }).eq("topic_id", topic.id).eq("status", "published").eq("index", p.index));
    console.log(slug, "ok", paths.length);
  } catch (e) {
    console.error(slug, "GAGAL", e.message);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
