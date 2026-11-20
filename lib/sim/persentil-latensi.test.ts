import { expect, test } from "vitest";
import { bucket, data, persentil, posisi, ringkas } from "./persentil-latensi";

test("nearest-rank sesuai contoh bab", () => {
  const d = [10, 12, 15, 18, 20, 22, 25, 30, 90, 800];
  expect([persentil(d, 50), persentil(d, 90), persentil(d, 99)]).toEqual([20, 90, 800]);
});

test("data deterministik, bucket menjumlah ke n", () => {
  expect(data(500, 2)).toEqual(data(500, 2));
  expect(bucket(data(500, 2)).reduce((a, b) => a + b)).toBe(500);
  expect(posisi(50)).toBe(2);
});

test("ekor lambat menaikkan p99 jauh lebih besar daripada p50", () => {
  const a = ringkas(data(1000, 0));
  const b = ringkas(data(1000, 5));
  expect(b.p99).toBeGreaterThan(a.p99 * 2);
  expect(Math.abs(b.p50 - a.p50)).toBeLessThan(15);
  expect(b.rata).toBeLessThan(b.p99 / 2);
});
