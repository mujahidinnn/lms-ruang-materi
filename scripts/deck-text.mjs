// Prints the text of a deck in Storage (imports/migrasi/<slug>.pptx), slide
// by slide, with speaker notes. The source for writing a class by hand
// (content/drafts/<slug>.json, provider claude:manual).
//
//   npm run deck:text -- sdlc > /tmp/sdlc.md
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const slug = process.argv[2];
if (!slug) throw new Error("usage: deck:text -- <slug>");
const env = process.env;
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await db.storage.from("imports").download(`migrasi/${slug}.pptx`);
if (error) throw new Error(`download: ${error.message}`);

const dir = mkdtempSync(join(tmpdir(), "deck-"));
try {
  const file = join(dir, "deck.pptx");
  writeFileSync(file, Buffer.from(await data.arrayBuffer()));
  const names = execFileSync("unzip", ["-Z1", file], { encoding: "utf8" }).split("\n");
  const slides = names.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  // One line per <a:p> paragraph, its <a:t> runs joined.
  const text = (xml) =>
    xml
      .split(/<\/a:p>/)
      .map((p) => [...p.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).join(""))
      .map((s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").trim())
      .filter(Boolean);
  for (const [i, name] of slides.entries()) {
    const n = name.match(/\d+/)[0];
    console.log(`\n## Slide ${i + 1}`);
    for (const line of text(execFileSync("unzip", ["-p", file, name], { encoding: "utf8", maxBuffer: 64e6 }))) console.log(line);
    const notes = `ppt/notesSlides/notesSlide${n}.xml`;
    if (names.includes(notes)) {
      const lines = text(execFileSync("unzip", ["-p", file, notes], { encoding: "utf8", maxBuffer: 64e6 })).filter((l) => !/^\d+$/.test(l));
      if (lines.length) console.log(`(catatan) ${lines.join(" ")}`);
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
