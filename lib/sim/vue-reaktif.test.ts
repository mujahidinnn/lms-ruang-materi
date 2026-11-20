import { expect, test } from "vitest";
import { basi, buat, buatManual, bacaUlang, perbarui, ubah, ubahManual } from "./vue-reaktif";

const R = { harga: 25000, jumlah: 2, diskon: 10 };

test("ubah diskon hanya menghitung ulang total, subtotal dari cache", () => {
  const s = ubah(buat(R), "diskon", 20);
  expect(s.ulang).toEqual(["total"]);
  expect(s.dariCache).toContain("subtotal");
  expect(s.subtotal.hitung).toBe(1);
  expect(s.total.hitung).toBe(2);
  expect(s.total.nilai).toBe(40000);
});

test("ubah harga menghitung ulang keduanya; nilai sama dan baca ulang memakai cache", () => {
  let s = ubah(buat(R), "harga", 30000);
  expect(s.ulang).toEqual(["subtotal", "total"]);
  const hitung = s.total.hitung;
  s = ubah(s, "harga", 30000);
  s = bacaUlang(s);
  expect(s.total.hitung).toBe(hitung);
  expect(s.ulang).toEqual([]);
});

test("manual: layar basi sampai perbarui dipanggil", () => {
  let m = ubahManual(buatManual(R), "jumlah", 3);
  expect(basi(m)).toEqual(["subtotal", "total"]);
  m = perbarui(m);
  expect(basi(m)).toEqual([]);
});
