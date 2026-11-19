export type Cell = string | number;
export type Table = { name: string; cols: string[]; rows: Cell[][]; pk: string[]; fk: string[] };

// 1NF form: one value per cell, key = (id_pesanan, produk).
const FLAT = [
  [1, "Ani", "Bandung", "Pensil", 3000, 2],
  [1, "Ani", "Bandung", "Buku", 8000, 1],
  [2, "Budi", "Jakarta", "Pensil", 3000, 5],
  [3, "Ani", "Bandung", "Buku", 8000, 3],
] as Cell[][];
const COLS = ["id_pesanan", "pelanggan", "kota", "produk", "harga", "qty"];

// [dependent, determinant]: the dependent value is repeated when the determinant repeats.
const DEPS = [["pelanggan", "id_pesanan"], ["kota", "pelanggan"], ["harga", "produk"]];

const uniq = (rows: Cell[][]) => rows.filter((r, i) => rows.findIndex((x) => x.join("|") === r.join("|")) === i);
const pick = (idx: number[]) => uniq(FLAT.map((r) => idx.map((i) => r[i])));
const t = (name: string, cols: string[], rows: Cell[][], pk: string[], fk: string[] = []): Table => ({ name, cols, rows, pk, fk });

// Step 0: unnormalised (list in a cell). 1: 1NF. 2: 2NF. 3: 3NF.
export function stepTables(step: number): Table[] {
  if (step === 0) {
    const ids = [...new Set(FLAT.map((r) => r[0]))];
    const rows = ids.map((id) => {
      const g = FLAT.filter((r) => r[0] === id);
      return [id, g[0][1], g[0][2], g.map((r) => r[3]).join(", "), g.map((r) => r[4]).join(", "), g.map((r) => r[5]).join(", ")];
    });
    return [t("pesanan", COLS, rows, ["id_pesanan"])];
  }
  if (step === 1) return [t("pesanan", COLS, FLAT, ["id_pesanan", "produk"])];
  if (step === 2)
    return [
      t("pesanan", ["id_pesanan", "pelanggan", "kota"], pick([0, 1, 2]), ["id_pesanan"]),
      t("item", ["id_pesanan", "produk", "qty"], pick([0, 3, 5]), ["id_pesanan", "produk"], ["id_pesanan", "produk"]),
      t("produk", ["produk", "harga"], pick([3, 4]), ["produk"]),
    ];
  const names = [...new Set(FLAT.map((r) => r[1]))];
  const pel = names.map((n, i) => [i + 1, n, FLAT.find((r) => r[1] === n)![2]]);
  const pid = (n: Cell) => pel.find((p) => p[1] === n)![0];
  return [
    t("pelanggan", ["id_pelanggan", "nama", "kota"], pel, ["id_pelanggan"]),
    t("pesanan", ["id_pesanan", "id_pelanggan"], uniq(FLAT.map((r) => [r[0], pid(r[1])])), ["id_pesanan"], ["id_pelanggan"]),
    t("produk", ["produk", "harga"], pick([3, 4]), ["produk"]),
    t("item", ["id_pesanan", "produk", "qty"], pick([0, 3, 5]), ["id_pesanan", "produk"], ["id_pesanan", "produk"]),
  ];
}

// "row,col" keys of cells that repeat a value already determined by an earlier row.
export function redundant(tb: Table): Set<string> {
  const out = new Set<string>();
  for (const [dep, det] of DEPS) {
    const d = tb.cols.indexOf(dep), k = tb.cols.indexOf(det);
    if (d < 0 || k < 0 || tb.pk.length === 1 && tb.pk[0] === dep) continue;
    const seen = new Set<Cell>();
    tb.rows.forEach((r, i) => {
      if (seen.has(r[k])) out.add(`${i},${d}`);
      seen.add(r[k]);
    });
  }
  return out;
}
