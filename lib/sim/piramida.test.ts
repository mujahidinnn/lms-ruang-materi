import { expect, it } from "vitest";
import { hitung, PRESET } from "./piramida";

it("piramida lebih cepat, murah, dan stabil dari cone", () => {
  const p = hitung(PRESET.piramida), c = hitung(PRESET["cone es krim"]);
  expect(p.terlaluE2e).toBe(false);
  expect(c.terlaluE2e).toBe(true);
  expect(p.detik).toBeLessThan(c.detik);
  expect(p.biaya).toBeLessThan(c.biaya);
  expect(p.flaky).toBeLessThan(c.flaky);
});
it("nol tes aman", () => {
  expect(hitung({ unit: 0, integrasi: 0, e2e: 0 })).toMatchObject({ total: 0, detik: 0, flaky: 0, shareE2e: 0 });
});
it("hitungan waktu", () => {
  expect(hitung({ unit: 100, integrasi: 0, e2e: 2 }).detik).toBeCloseTo(31);
});
