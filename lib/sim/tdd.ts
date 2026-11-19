export type Fase = "merah" | "hijau" | "refaktor";
export type Tes = { nama: string; lolos: boolean | null; pesan?: string };
export type TddStep = { fase: Fase; putaran: number; tes: Tes[]; kode: string[]; baru: number[]; teks: string };

const T = ["kabisat(2024) → true", "kabisat(1900) → false", "kabisat(2000) → true"];
const K1 = ["function kabisat(tahun) {", "  return tahun % 4 === 0;", "}"];
const K2 = ["function kabisat(tahun) {", "  return tahun % 4 === 0 && tahun % 100 !== 0;", "}"];
const K3 = ["function kabisat(tahun) {", "  return (tahun % 4 === 0 && tahun % 100 !== 0) || tahun % 400 === 0;", "}"];
const K4 = [
  "function kabisat(tahun) {",
  "  const habisDibagi = (n) => tahun % n === 0;",
  "  if (habisDibagi(400)) return true;",
  "  if (habisDibagi(100)) return false;",
  "  return habisDibagi(4);",
  "}",
];
const t = (n: number, st: (boolean | null)[], pesan?: Record<number, string>): Tes[] =>
  T.slice(0, n).map((nama, i) => ({ nama, lolos: st[i], pesan: pesan?.[i] }));

export const STEPS: TddStep[] = [
  { fase: "merah", putaran: 1, tes: t(1, [false], { 0: "ReferenceError: kabisat is not defined" }), kode: [], baru: [], teks: "Tulis tes pertama sebelum kodenya ada. Jalankan: merah, karena kabisat belum ada." },
  { fase: "hijau", putaran: 1, tes: t(1, [true]), kode: K1, baru: [1], teks: "Kode paling sederhana yang membuat tes lolos: habis dibagi 4." },
  { fase: "merah", putaran: 2, tes: t(2, [true, false], { 1: "Harapan false, aktual true" }), kode: K1, baru: [], teks: "Tes baru untuk pengecualian abad. 1900 habis dibagi 4, jadi kode lama salah. Tes lama tetap hijau." },
  { fase: "hijau", putaran: 2, tes: t(2, [true, true]), kode: K2, baru: [1], teks: "Tambah aturan seratus. Kedua tes hijau." },
  { fase: "merah", putaran: 3, tes: t(3, [true, true, false], { 2: "Harapan true, aktual false" }), kode: K2, baru: [], teks: "Tes untuk pengecualian dari pengecualian: 2000 kabisat. Merah lagi." },
  { fase: "hijau", putaran: 3, tes: t(3, [true, true, true]), kode: K3, baru: [1], teks: "Tambah aturan 400. Semua tes hijau." },
  { fase: "refaktor", putaran: 3, tes: t(3, [true, true, true]), kode: K4, baru: [1, 2, 3, 4], teks: "Rapikan bentuk kode tanpa mengubah perilaku. Tiga tes tetap hijau, jadi perilakunya sama." },
];
