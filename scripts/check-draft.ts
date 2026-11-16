// Checks a hand-written class (content/drafts/<slug>.json) before importing
// it with npm run import:manual: the worker's schema, exercises and project
// run against their own checks, and the content rules from GUIDELINE.
//
//   npm run draft:check -- sdlc 36      (36 = slides in the deck)
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { BIAS_LIMIT, longestCorrectShare, maxPositionShare } from "../lib/answer-bias.ts";
import { diagramCount, missingDiagrams } from "../lib/chapters.ts";
import { draftSchema, failingChecks } from "../worker/prompt.ts";

const [slug, slidesArg] = process.argv.slice(2);
if (!slug) throw new Error("usage: draft:check -- <slug> <slide count>");
const slides = Number(slidesArg) || 80;
const raw = JSON.parse(await readFile(`content/drafts/${slug}.json`, "utf8"));
const parsed = draftSchema.safeParse(raw);
if (!parsed.success) {
  for (const i of parsed.error.issues.slice(0, 20)) console.log("SKEMA", i.path.join("."), i.code, i.message);
  process.exit(1);
}
const d = parsed.data;
const problems: string[] = [];
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

for (const [i, c] of d.chapters.entries()) {
  const n = `bab ${i + 1} (${c.slug})`;
  const w = words(c.body);
  const h2 = c.body.match(/^## .+$/gm) ?? [];
  const embeds = [...c.body.matchAll(/\]\(slide:(\d+)\)/g)].map((m) => Number(m[1]));
  console.log(`${n}: ${w} kata, ${h2.length} bagian, kuis ${c.quiz.length}, kode ${c.exercises.length}, slide ${c.slide_from}-${c.slide_to}`);
  if (w < 900 || w > 1700) problems.push(`${n}: ${w} kata, target 900-1500`);
  if (h2[0] !== "## Tujuan") problems.push(`${n}: harus mulai dengan ## Tujuan`);
  if (h2.at(-1) !== "## Rangkuman") problems.push(`${n}: harus berakhir dengan ## Rangkuman`);
  const missing = missingDiagrams(c.body, (name) => existsSync(`public/praktik/${name}.svg`));
  if (missing.length) problems.push(`${n}: gambar tidak ada: ${missing.join(", ")}`);
  if (diagramCount(c.body) > 3) problems.push(`${n}: ${diagramCount(c.body)} gambar, maksimal 3`);
  if (embeds.length > 1) problems.push(`${n}: ${embeds.length} sisipan slide, maksimal 1`);
  if (embeds.some((e) => e < c.slide_from || e > c.slide_to)) problems.push(`${n}: sisipan slide di luar rentang bab`);
  if (c.slide_to > slides) problems.push(`${n}: slide_to ${c.slide_to} melebihi ${slides} slide`);
  if (c.quiz.length < 3) problems.push(`${n}: kuis minimal 3 soal`);
  for (const e of c.exercises) {
    const failing = await failingChecks(e);
    if (failing.length) problems.push(`${n}: latihan "${e.title}" gagal: ${failing.join("; ")}`);
    if (e.kind !== "web" && !(await failingChecks({ ...e, solution: e.starter })).length) problems.push(`${n}: kode awal "${e.title}" sudah lolos semua pemeriksaan`);
  }
}
if (d.project) {
  const failing = await failingChecks(d.project);
  console.log(`proyek: ${d.project.title} (${d.project.kind}), ${d.project.tests.length} pemeriksaan, ${failing.length ? "GAGAL" : "lolos"}`);
  if (failing.length) problems.push(`proyek gagal: ${failing.join("; ")}`);
}
const practice = new Set(d.practice_questions.map((q) => q.prompt.trim().toLowerCase()));
const dup = d.exam_questions.filter((q) => practice.has(q.prompt.trim().toLowerCase()));
if (dup.length) problems.push(`${dup.length} soal ujian sama dengan soal latihan`);
const pct = (x: number) => `${Math.round(x * 100)}%`;
for (const [name, qs] of [["ujian", d.exam_questions], ["latihan", d.practice_questions], ["kuis bab", d.chapters.flatMap((c) => c.quiz)]] as const) {
  const share = longestCorrectShare(qs);
  if (share > BIAS_LIMIT) problems.push(`bias panjang opsi: ${name} ${pct(share)} opsi benar terpanjang (batas ${pct(BIAS_LIMIT)})`);
}
const pos = maxPositionShare(d.exam_questions);
if (pos > BIAS_LIMIT) problems.push(`bias posisi jawaban ujian: ${pct(pos)} di satu posisi (batas ${pct(BIAS_LIMIT)})`);
const cites = JSON.stringify(d).match(/\[cite[^\]]*\]/g);
if (cites) problems.push(`${cites.length} penanda [cite]`);
console.log(`ringkasan: ${d.chapters.length} bab, ${d.flashcards.length} kartu, ${d.practice_questions.length} latihan, ${d.exam_questions.length} ujian, ${d.tips.length} tips`);
console.log(problems.length ? `\nMASALAH:\n- ${problems.join("\n- ")}` : "\nOK, siap diimpor");
process.exit(problems.length ? 1 : 0);
