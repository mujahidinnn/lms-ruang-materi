import { expect, test } from "vitest";
import { contrast, parseHex, verdicts } from "./kontras";

test("hitam di putih = 21:1, sama = 1:1", () => {
  expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
  expect(contrast("#777", "#777")).toBeCloseTo(1, 5);
});
test("pasangan dikenal", () => {
  expect(contrast("#767676", "#ffffff")!).toBeCloseTo(4.54, 2);
  expect(contrast("#777777", "#ffffff")!).toBeLessThan(4.5);
});
test("parse hex dan verdict", () => {
  expect(parseHex("#fff")).toEqual([255, 255, 255]);
  expect(parseHex("zzz")).toBeNull();
  expect(contrast("x", "#fff")).toBeNull();
  expect(verdicts(4).map((v) => v.ok)).toEqual([false, true, false]);
});
