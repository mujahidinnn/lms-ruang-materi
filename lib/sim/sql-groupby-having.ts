// Urutan eksekusi kueri: FROM, WHERE, GROUP BY, HAVING, SELECT. Murni, tanpa DOM.
export type Baris = { id: number; kota: string; produk: string; qty: number };
export type Kolom = "kota" | "produk" | "tanpa";
export type Fn = "COUNT" | "SUM" | "AVG";
export type Where = "tanpa" | "qty >= 3" | "produk <> 'Roti'";
export type Having = "tanpa" | "> 2" | "> 4" | "> 10";
export type Opsi = { kolom: Kolom; fn: Fn; where: Where; having: Having };

export const PESANAN: Baris[] = [
  [1, "Jakarta", "Kopi", 4], [2, "Bandung", "Teh", 2], [3, "Jakarta", "Roti", 1], [4, "Medan", "Kopi", 5],
  [5, "Bandung", "Kopi", 3], [6, "Jakarta", "Teh", 2], [7, "Medan", "Roti", 2], [8, "Jakarta", "Kopi", 6],
  [9, "Bandung", "Roti", 1], [10, "Medan", "Teh", 3], [11, "Jakarta", "Teh", 4], [12, "Bandung", "Kopi", 5],
].map(([id, kota, produk, qty]) => ({ id, kota, produk, qty }) as Baris);

const LOLOS: Record<Where, (b: Baris) => boolean> = {
  tanpa: () => true,
  "qty >= 3": (b) => b.qty >= 3,
  "produk <> 'Roti'": (b) => b.produk !== "Roti",
};
const hitung = (fn: Fn, rows: Baris[]) => (fn === "COUNT" ? rows.length : fn === "SUM" ? rows.reduce((a, b) => a + b.qty, 0) : rows.reduce((a, b) => a + b.qty, 0) / rows.length);
const bulat = (n: number) => Math.round(n * 10) / 10;

export function jalankan(o: Opsi, data: Baris[] = PESANAN) {
  const lolosWhere = data.filter(LOLOS[o.where]);
  const kunci = [...new Set(lolosWhere.map((b) => (o.kolom === "tanpa" ? "semua baris" : b[o.kolom])))];
  const batas = o.having === "tanpa" ? -Infinity : Number(o.having.slice(2));
  const kelompok = kunci.map((k) => {
    const baris = lolosWhere.filter((b) => (o.kolom === "tanpa" ? true : b[o.kolom] === k));
    const nilai = hitung(o.fn, baris);
    return { kunci: k, baris, nilai: bulat(nilai), lolos: nilai > batas };
  });
  const ekspresi = o.fn === "COUNT" ? "COUNT(*)" : `${o.fn}(qty)`;
  const sql = [
    { klausa: "select", teks: `SELECT ${o.kolom === "tanpa" ? "" : o.kolom + ", "}${ekspresi} AS hasil` },
    { klausa: "from", teks: "FROM pesanan" },
    ...(o.where === "tanpa" ? [] : [{ klausa: "where", teks: `WHERE ${o.where}` }]),
    ...(o.kolom === "tanpa" ? [] : [{ klausa: "group", teks: `GROUP BY ${o.kolom}` }]),
    ...(o.having === "tanpa" ? [] : [{ klausa: "having", teks: `HAVING ${ekspresi} ${o.having}` }]),
  ];
  return { awal: data, lolosWhere, kelompok, hasil: kelompok.filter((g) => g.lolos), sql };
}

export const TAHAP = ["1 FROM", "2 WHERE", "3 GROUP BY", "4 HAVING", "5 SELECT"] as const;

export function ringkas(o: Opsi, tahap: number): string {
  const r = jalankan(o);
  const w = r.lolosWhere.length;
  if (tahap === 0) return `FROM mengambil semua ${r.awal.length} baris tabel pesanan.`;
  if (tahap === 1) return o.where === "tanpa" ? `Tanpa WHERE, semua ${w} baris lanjut.` : `WHERE menyaring baris satu per satu: ${r.awal.length} baris menjadi ${w}. Ini terjadi sebelum pengelompokan.`;
  if (tahap === 2) return o.kolom === "tanpa" ? `Tanpa GROUP BY, ${w} baris dianggap satu kelompok.` : `GROUP BY ${o.kolom} membagi ${w} baris menjadi ${r.kelompok.length} kelompok.`;
  if (tahap === 3) return o.having === "tanpa" ? `Tanpa HAVING, ${r.kelompok.length} kelompok lanjut.` : `HAVING menyaring kelompok setelah ${o.fn} dihitung: ${r.kelompok.length} kelompok menjadi ${r.hasil.length}.`;
  return r.hasil.length ? `SELECT menampilkan ${r.hasil.length} baris hasil. SELECT ditulis paling atas, tetapi dijalankan paling akhir.` : "Tidak ada kelompok yang lolos, hasilnya kosong.";
}
