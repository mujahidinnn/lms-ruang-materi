import { expect, test } from "vitest";
import { draftSchema } from "./prompt";

const q = (i: number, type = "pilihan_ganda") => ({
  type,
  prompt: `Soal ${i}`,
  code: type === "baca_kode" ? "console.log(1)" : "",
  options: type === "benar_salah" ? ["Benar", "Salah"] : ["a", "b", "c", "d"],
  answer: 1,
  explanation: "karena",
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
};

test("gemini: valid draft parses", () => {
  expect(draftSchema.safeParse(valid).success).toBe(true);
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
