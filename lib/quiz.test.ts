import { describe, expect, it, test } from "vitest";
import { sampleQuestions, setResult, shuffleOptions } from "./quiz";

const q = (id: string, answer = 1) => ({ id, type: "pilihan_ganda", options: ["a", "b", "c", "d"], answer });

describe("shuffleOptions", () => {
  it("keeps the same answer text and options", () => {
    const s = shuffleOptions(q("x1"));
    expect(s.options.toSorted()).toEqual(["a", "b", "c", "d"]);
    expect(s.options[s.answer]).toBe("b");
  });

  it("is stable per id and spreads keys across positions", () => {
    expect(shuffleOptions(q("x1"))).toEqual(shuffleOptions(q("x1")));
    const positions = new Set(Array.from({ length: 40 }, (_, i) => shuffleOptions(q(`id-${i}`)).answer));
    expect(positions.size).toBe(4);
  });

  it("leaves benar/salah alone", () => {
    const bs = { id: "y", type: "benar_salah", options: ["Benar", "Salah"], answer: 0 };
    expect(shuffleOptions(bs)).toBe(bs);
  });
});

test("a practice set is a win only when every answer is right", () => {
  expect(setResult(10, 10)).toEqual({ score: 100, win: true });
  expect(setResult(9, 10)).toEqual({ score: 90, win: false });
});

test("an exam-prep set is a win at or above the pass score", () => {
  expect(setResult(14, 20, 70)).toEqual({ score: 70, win: true });
  expect(setResult(13, 20, 70)).toEqual({ score: 65, win: false });
});

test("sampleQuestions takes n distinct questions, all when fewer", () => {
  const list = Array.from({ length: 30 }, (_, i) => ({ id: `q${i}` }));
  let seed = 1;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const picked = sampleQuestions(list, 20, rand);
  expect(picked).toHaveLength(20);
  expect(new Set(picked.map((q) => q.id)).size).toBe(20);
  expect(sampleQuestions(list.slice(0, 5), 20, rand)).toHaveLength(5);
});
