import { expect, test } from "vitest";
import { awal, deepLink, gantiTab, pop, push, teratas } from "./navigasi-stack";

test("push dan pop tidak mengubah keadaan lama; pop di dasar tidak berefek", () => {
  const a = awal();
  const b = push(a, { nama: "detail", params: { id: "42" } });
  expect(a.tab.kelas).toHaveLength(1);
  expect(b.tab.kelas).toHaveLength(2);
  expect(pop(b).tab.kelas).toHaveLength(1);
  expect(pop(a)).toBe(a);
});

test("tumpukan tiap tab terjaga saat berpindah tab", () => {
  let k = push(awal(), { nama: "detail", params: { id: "7" } });
  k = gantiTab(k, "profil");
  expect(teratas(k).nama).toBe("profil");
  k = gantiTab(k, "kelas");
  expect(teratas(k)).toEqual({ nama: "detail", params: { id: "7" } });
});

test("deep link membentuk tumpukan benar dan menolak tautan tidak sah", () => {
  const r = deepLink(awal(), "ruangmateri://kelas/42/bab/3");
  expect(r.keadaan.tab.kelas.map((l) => l.nama)).toEqual(["daftar", "detail", "bab"]);
  expect(r.keadaan.tab.kelas[1].params).toEqual({ id: "42" });
  const x = deepLink(awal(), "ruangmateri://kelas/abc");
  expect(x.ok).toBe(false);
  expect(x.keadaan).toEqual(awal());
});
