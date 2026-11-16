import { expect, test } from "vitest";
import { BIAS_LIMIT, longestCorrectShare, maxPositionShare } from "./answer-bias";

const mc = (options: string[], answer: number) => ({ type: "pilihan_ganda", options, answer });

test("longestCorrectShare is 1 when every correct option is the longest", () => {
  expect(longestCorrectShare([mc(["a", "bbbb", "cc", "d"], 1), mc(["xx", "y", "zzzzz", "w"], 2)])).toBe(1);
});

test("longestCorrectShare is 0 when no correct option is the longest", () => {
  expect(longestCorrectShare([mc(["a", "bbbb", "cc", "d"], 0), mc(["xx", "y", "zzzzz", "w"], 3)])).toBe(0);
});

test("a tie for the longest counts as the longest", () => {
  expect(longestCorrectShare([mc(["aa", "bb", "cc", "dd"], 2)])).toBe(1);
});

test("benar_salah questions are ignored", () => {
  expect(longestCorrectShare([{ type: "benar_salah", options: ["Benar", "Salah"], answer: 0 }])).toBe(0);
  expect(longestCorrectShare([mc(["a", "bbbb", "cc", "d"], 1), { type: "benar_salah", options: ["Benar", "Salah"], answer: 0 }])).toBe(1);
});

test("an empty list is 0", () => {
  expect(longestCorrectShare([])).toBe(0);
  expect(maxPositionShare([])).toBe(0);
});

test("maxPositionShare is the share of the most used answer index", () => {
  const qs = [0, 0, 0, 1].map((a) => mc(["a", "b", "c", "d"], a));
  expect(maxPositionShare(qs)).toBe(0.75);
});

test("the limit is 40 percent", () => {
  expect(BIAS_LIMIT).toBe(0.4);
});
