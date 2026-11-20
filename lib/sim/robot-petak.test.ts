import { expect, test } from "vitest";
import { jalankan, LEVELS, ulangi } from "./robot-petak";

test("solusi tiap level berhasil", () => {
  for (const l of LEVELS) expect(jalankan(l, l.solusi).hasil).toBe("sukses");
  expect(jalankan(LEVELS[0], LEVELS[0].solusi).langkah).toBe(11);
});

test("tabrak batu dan keluar petak", () => {
  expect(jalankan(LEVELS[0], ["kanan", "maju", "kiri", "maju"]).hasil).toBe("tabrak");
  expect(jalankan(LEVELS[0], ["kiri", "maju"]).hasil).toBe("keluar");
});

test("ulangi diperluas dan program ringkas ada di batas", () => {
  expect(ulangi([{ ulang: 3, isi: "maju" }, "kanan"])).toEqual(["maju", "maju", "maju", "kanan"]);
  expect(LEVELS[2].solusi.length).toBeLessThanOrEqual(LEVELS[2].maksItem);
});
