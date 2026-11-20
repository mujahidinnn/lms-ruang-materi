import { expect, test } from "vitest";
import { jalankan, PESANAN } from "./sql-groupby-having";

const o = { kolom: "kota", fn: "COUNT", where: "tanpa", having: "tanpa" } as const;

test("GROUP BY kota: 3 kelompok dengan jumlah baris benar", () => {
  const r = jalankan(o);
  expect(r.kelompok.map((g) => [g.kunci, g.nilai])).toEqual([["Jakarta", 5], ["Bandung", 4], ["Medan", 3]]);
  expect(r.awal).toHaveLength(PESANAN.length);
});

test("WHERE menyaring baris sebelum grup, HAVING menyaring kelompok sesudahnya", () => {
  const w = jalankan({ ...o, fn: "SUM", where: "qty >= 3" });
  expect(w.lolosWhere.every((b) => b.qty >= 3)).toBe(true);
  expect(w.kelompok.map((g) => g.nilai)).toEqual([14, 8, 8]);
  const h = jalankan({ ...o, fn: "SUM", having: "> 10" });
  expect(h.hasil.map((g) => g.kunci)).toEqual(["Jakarta", "Bandung"]);
});

test("SQL dibangun sesuai pilihan; tanpa GROUP BY ada satu kelompok", () => {
  const r = jalankan({ kolom: "tanpa", fn: "AVG", where: "tanpa", having: "tanpa" });
  expect(r.sql.map((x) => x.teks)).toEqual(["SELECT AVG(qty) AS hasil", "FROM pesanan"]);
  expect(r.kelompok).toHaveLength(1);
  expect(r.kelompok[0].nilai).toBe(3.2);
});
