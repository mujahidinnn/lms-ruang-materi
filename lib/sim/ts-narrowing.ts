export type NStep = { line: number; type: string; note: string; err?: string };
export type NPreset = { name: string; code: string[]; vari: string; steps: NStep[] };

export const PRESETS: NPreset[] = [
  {
    name: "typeof",
    vari: "nilai",
    code: [
      "function format(nilai: string | number) {",
      "  nilai.toUpperCase();",
      "  if (typeof nilai === \"string\") {",
      "    return nilai.toUpperCase();",
      "  }",
      "  return nilai.toFixed(2);",
      "}",
    ],
    steps: [
      { line: 0, type: "string | number", note: "Parameter berupa union. Hanya anggota milik kedua tipe yang boleh dipakai." },
      { line: 1, type: "string | number", note: "Belum ada pengecekan, compiler menolak.", err: "Property 'toUpperCase' does not exist on type 'string | number'. Property 'toUpperCase' does not exist on type 'number'." },
      { line: 2, type: "string", note: "typeof === \"string\" mempersempit tipe di dalam cabang if." },
      { line: 3, type: "string", note: "Di sini nilai pasti string, toUpperCase() aman." },
      { line: 5, type: "number", note: "Cabang string sudah return, sisanya pasti number. toFixed() aman." },
    ],
  },
  {
    name: "cek null",
    vari: "teks",
    code: [
      "function panjang(teks: string | null) {",
      "  teks.length;",
      "  if (teks === null) return 0;",
      "  return teks.length;",
      "}",
    ],
    steps: [
      { line: 0, type: "string | null", note: "null ikut menjadi anggota union." },
      { line: 1, type: "string | null", note: "Memakai .length sebelum mengecek null ditolak.", err: "'teks' is possibly 'null'." },
      { line: 2, type: "null", note: "Di dalam cabang ini compiler tahu teks adalah null, lalu fungsi berhenti dengan return." },
      { line: 3, type: "string", note: "null sudah disingkirkan, sisanya string. .length aman." },
    ],
  },
  {
    name: "discriminated union",
    vari: "b",
    code: [
      "type Bentuk =",
      "  | { kind: \"lingkaran\"; r: number }",
      "  | { kind: \"persegi\"; sisi: number };",
      "function luas(b: Bentuk) {",
      "  b.r ** 2;",
      "  if (b.kind === \"lingkaran\") return b.r ** 2;",
      "  return b.sisi ** 2;",
      "}",
    ],
    steps: [
      { line: 3, type: "{ kind: \"lingkaran\"; r } | { kind: \"persegi\"; sisi }", note: "Setiap anggota union punya properti kind berisi literal unik." },
      { line: 4, type: "{ kind: \"lingkaran\"; r } | { kind: \"persegi\"; sisi }", note: "r hanya ada di satu anggota, compiler menolak.", err: "Property 'r' does not exist on type 'Bentuk'. Property 'r' does not exist on type '{ kind: \"persegi\"; sisi: number }'." },
      { line: 5, type: "{ kind: \"lingkaran\"; r }", note: "b.kind === \"lingkaran\" memilih tepat satu anggota, b.r aman." },
      { line: 6, type: "{ kind: \"persegi\"; sisi }", note: "Lingkaran sudah ditangani, tersisa persegi. b.sisi aman." },
    ],
  },
];
