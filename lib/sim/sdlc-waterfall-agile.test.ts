import { expect, test } from "vitest";
import { agile, featuresAt, waterfall } from "./sdlc-waterfall-agile";

test("tanpa perubahan: waterfall 13 minggu, software baru di akhir", () => {
  const w = waterfall(false);
  expect([w.total, w.firstWorking, w.rework, w.feedback]).toEqual([13, 13, 0, 1]);
  expect(featuresAt(w, 12)).toBe(0);
  expect(featuresAt(w, 13)).toBe(6);
});

test("tanpa perubahan: agile 3 sprint, software pertama di minggu 3", () => {
  const a = agile(false);
  expect([a.total, a.firstWorking, a.rework, a.feedback]).toEqual([9, 3, 0, 3]);
  expect(featuresAt(a, 6)).toBe(4);
});

test("perubahan: waterfall mengulang kebutuhan, desain, bangun, uji", () => {
  const w = waterfall(true);
  expect(w.rework).toBe(6);
  expect(w.total).toBe(19);
  expect(w.segs.reduce((s, x) => s + x.len, 0)).toBe(19);
});

test("perubahan: agile hanya mengulang fitur terdampak yang sudah rilis", () => {
  const a = agile(true);
  expect(a.rework).toBe(1);
  expect(a.total).toBe(10);
  expect(a.firstWorking).toBe(3);
  expect(featuresAt(a, 10)).toBe(6);
});
