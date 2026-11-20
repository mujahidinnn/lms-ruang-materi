import { expect, test } from "vitest";
import { budget, hitung } from "./error-budget";

test("budget sesuai angka bab", () => {
  expect([budget(99), budget(99.9), budget(99.99)]).toEqual([432, 43.2, 4.32]);
});

test("status berubah aman, waspada, habis", () => {
  expect(hitung(99.9, [10]).status).toBe("aman");
  expect(hitung(99.9, [10, 20]).status).toBe("waspada");
  expect(hitung(99.9, [30, 20])).toMatchObject({ status: "habis", lebih: 6.8, persenSisa: 0 });
});

test("ketersediaan aktual dihitung dari total downtime", () => {
  expect(hitung(99, [432]).aktual).toBe(99);
});
