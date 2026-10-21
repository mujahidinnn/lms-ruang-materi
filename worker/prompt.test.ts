import { expect, test } from "vitest";
import { draftSchema, repairDraft, validateExercises } from "./prompt";

const q = (i: number, type = "pilihan_ganda") => ({
  type,
  prompt: `Soal ${i}`,
  code: type === "baca_kode" ? "console.log(1)" : "",
  options: type === "benar_salah" ? ["Benar", "Salah"] : ["a", "b", "c", "d"],
  answer: 1,
  explanation: "karena",
});

const chapter = (i: number) => ({
  slug: `bab-${i}`,
  title: `Bab ${i}`,
  est_minutes: 8,
  slide_from: 1,
  slide_to: 3,
  body: "Isi bab yang cukup panjang untuk lolos batas minimum. ".repeat(6) + "\n\n![Slide](slide:2)",
  quiz: [q(500 + i * 10), q(501 + i * 10, "benar_salah")],
});

const valid = {
  title: "Git",
  description: "Dasar Git.",
  summary: "Paragraf satu.\n\nParagraf dua.",
  tips: ["a", "b", "c"],
  flashcards: Array.from({ length: 15 }, (_, i) => ({ front: `f${i}`, back: `b${i}` })),
  practice_questions: Array.from({ length: 10 }, (_, i) => q(i, i % 3 === 0 ? "benar_salah" : "pilihan_ganda")),
  exam_questions: Array.from({ length: 40 }, (_, i) => q(100 + i, i % 5 === 0 ? "baca_kode" : "pilihan_ganda")),
  prerequisites: ["html5"],
  chapters: [1, 2, 3, 4].map(chapter),
};

test("gemini: valid draft parses", () => {
  expect(draftSchema.safeParse(valid).success).toBe(true);
});

test("extra exam questions are trimmed to 40", () => {
  const extra = { ...valid, exam_questions: [...valid.exam_questions, q(999)] };
  const parsed = draftSchema.parse(extra);
  expect(parsed.exam_questions).toHaveLength(40);
});

test("gemini: broken drafts fail", () => {
  const broken = [
    { ...valid, exam_questions: valid.exam_questions.slice(0, 39) },
    { ...valid, practice_questions: [{ ...q(1, "benar_salah"), options: ["a", "b", "c", "d"] }, ...valid.practice_questions.slice(1)] },
    { ...valid, practice_questions: [{ ...q(1), answer: 4 }, ...valid.practice_questions.slice(1)] },
    { ...valid, practice_questions: [{ ...q(1), code: "x" }, ...valid.practice_questions.slice(1)] },
    { ...valid, prerequisites: ["Bukan Slug"] },
  ];
  for (const b of broken) expect(draftSchema.safeParse(b).success).toBe(false);
});

test("schema sent to providers keeps only supported keywords", async () => {
  const { simpleSchema } = await import("./llm/schema");
  const { draftJsonSchema } = await import("./prompt");
  const out = JSON.stringify(simpleSchema(draftJsonSchema));
  expect(out).not.toMatch(/"(minLength|maxLength|pattern|\$schema)":/);
  expect(out).toContain('"exam_questions"');
  expect(out).not.toContain('"minItems"');
});

test("repair fixes the type to match the code, then drops what is still broken", () => {
  const exam = [
    ...valid.exam_questions.slice(0, 40),
    { ...q(200, "baca_kode"), code: "" },
    { ...q(201), code: "x = 1" },
    { ...q(202, "benar_salah"), options: ["a", "b", "c", "d"] },
  ];
  const out = repairDraft({ ...valid, exam_questions: exam }) as typeof valid;
  expect(out.exam_questions).toHaveLength(42);
  expect(out.exam_questions[40].type).toBe("pilihan_ganda");
  expect(out.exam_questions[41].type).toBe("baca_kode");
  expect(draftSchema.safeParse(out).success).toBe(true);
});

test("repair cannot rescue a draft below the minimums", () => {
  const short = { ...valid, practice_questions: [{ ...q(1), answer: 4 }, ...valid.practice_questions.slice(1)] };
  expect(draftSchema.safeParse(repairDraft(short)).success).toBe(false);
});

test("repair trims too many practice questions", () => {
  const many = { ...valid, practice_questions: Array.from({ length: 33 }, (_, i) => q(i)) };
  expect(draftSchema.parse(repairDraft(many)).practice_questions).toHaveLength(15);
});

test("a draft needs 4 to 12 chapters", () => {
  expect(draftSchema.safeParse(valid).success).toBe(true);
  expect(draftSchema.safeParse({ ...valid, chapters: valid.chapters.slice(0, 3) }).success).toBe(false);
});

test("repairDraft clamps slide ranges and drops broken chapter questions", () => {
  const broken = {
    ...valid,
    chapters: [
      { ...chapter(1), slide_from: 0, slide_to: 99 },
      { ...chapter(2), quiz: [q(1), q(2), { ...q(3), answer: 9 }] },
      chapter(3),
      chapter(4),
    ],
  };
  const out = draftSchema.parse(repairDraft(broken, 30));
  expect(out.chapters[0].slide_from).toBe(1);
  expect(out.chapters[0].slide_to).toBe(30);
  expect(out.chapters[1].quiz).toHaveLength(2);
});

test("repairDraft drops a chapter left with one question or a short body", () => {
  const broken = {
    ...valid,
    chapters: [chapter(1), { ...chapter(2), quiz: [q(1), { ...q(2), answer: 9 }] }, { ...chapter(3), body: "pendek" }, chapter(4), chapter(5), chapter(6)],
  };
  const out = draftSchema.parse(repairDraft(broken, 30));
  expect(out.chapters.map((c) => c.slug)).toEqual(["bab-1", "bab-4", "bab-5", "bab-6"]);
});

test("validateExercises drops an exercise whose solution fails its own tests", async () => {
  const ok = { kind: "js", title: "Jumlah", prompt: "p", starter: { code: "" }, solution: { code: "function jumlah(a, b) { return a + b }" }, setup: "", tests: [{ name: "2+3", check: "jumlah(2, 3) === 5" }] };
  const bad = { ...ok, title: "Salah", solution: { code: "function jumlah(a, b) { return a - b }" } };
  const web = { ...ok, kind: "web", title: "Web", solution: { html: "<h1>x</h1>" } };
  const d = draftSchema.parse({ ...valid, chapters: valid.chapters.map((c, i) => (i === 0 ? { ...c, exercises: [ok, bad] } : i === 1 ? { ...c, exercises: [web] } : c)) });
  const out = await validateExercises(d);
  expect(out.chapters[0].exercises.map((e) => e.title)).toEqual(["Jumlah"]);
  expect(out.chapters[1].exercises.map((e) => e.title)).toEqual(["Web"]);
  expect(out.chapters[2].exercises).toEqual([]);
});

test("a broken exercise is dropped, not the whole draft", () => {
  const broken = { kind: "python", title: "x" };
  const out = draftSchema.safeParse(repairDraft({ ...valid, chapters: valid.chapters.map((c) => ({ ...c, exercises: [broken] })) }));
  expect(out.success).toBe(true);
  expect(out.data?.chapters[0].exercises).toEqual([]);
});

// Two-stage drafting (spec 2026-10-21-kelas-ala-dicoding).
const outline = (i: number) => ({ slug: `bab-${i}`, title: `Bab ${i}`, est_minutes: 15, slide_from: 1, slide_to: 3, goals: ["paham a", "bisa b"], code_kind: "js" });
const { classSchema, chapterSchema, repairChapter, buildClassPrompt, buildChapterPrompt } = await import("./prompt");
const { chapters: _c, ...classBase } = valid;

test("a class outline has 4 to 12 chapters", () => {
  const ok = { ...classBase, outline: Array.from({ length: 12 }, (_, i) => outline(i)), project: null };
  expect(classSchema.safeParse(ok).success).toBe(true);
  expect(classSchema.safeParse({ ...ok, outline: Array.from({ length: 13 }, (_, i) => outline(i)) }).success).toBe(false);
});

test("a stage-2 chapter needs a real body", () => {
  const quiz = [q(1), q(2), q(3)];
  expect(chapterSchema.safeParse({ body: "x".repeat(2000), quiz, exercises: [] }).success).toBe(false);
  expect(chapterSchema.safeParse({ body: "x".repeat(2600), quiz, exercises: [] }).success).toBe(true);
});

test("repairChapter trims the quiz to 5 and drops broken exercises", () => {
  const out = repairChapter({ body: "x".repeat(2600), quiz: [1, 2, 3, 4, 5, 6].map((i) => q(i)), exercises: [{ kind: "python" }] }) as { quiz: unknown[]; exercises: unknown[] };
  expect(out.quiz).toHaveLength(5);
  expect(out.exercises).toEqual([]);
});

test("the class prompt offers the current chapter slugs for reuse", () => {
  expect(buildClassPrompt([], [{ slug: "pengenalan", title: "Pengenalan" }]).user).toContain("pengenalan");
});

test("the chapter prompt names the chapter, its goals, slides and length", () => {
  const list = [outline(1), { ...outline(2), title: "Routing Express", goals: ["membuat route GET"], slide_from: 7, slide_to: 12 }];
  const p = buildChapterPrompt("Express.js", list, 1).user;
  expect(p).toContain("Routing Express");
  expect(p).toContain("membuat route GET");
  expect(p).toContain("7 sampai 12");
  expect(p).toContain("900 sampai 1500 kata");
});
