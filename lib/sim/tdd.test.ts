import { expect, it } from "vitest";
import { STEPS } from "./tdd";

it("merah punya tes gagal, hijau dan refaktor semua lolos", () => {
  for (const s of STEPS) {
    const gagal = s.tes.some((x) => x.lolos === false);
    expect(gagal).toBe(s.fase === "merah");
    if (s.fase === "merah") expect(s.tes.at(-1)?.pesan).toBeTruthy();
  }
});
it("urutan fase benar", () => {
  expect(STEPS.map((s) => s.fase[0]).join("")).toBe("mhmhmhr");
});
