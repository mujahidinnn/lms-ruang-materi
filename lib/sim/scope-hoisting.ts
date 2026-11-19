export type VState = "tdz" | "undef" | "val" | "fn";
export type Op =
  | { s: string; v: string; val: string; st: VState }
  | { open: string }
  | { close: string; keep?: boolean };
type Raw = { line: number; note: string; ops: Op[]; out?: string; err?: string };
export type Snap = {
  line: number;
  note: string;
  phase: "creation" | "eksekusi";
  scopes: { name: string; kept: boolean; vars: { name: string; val: string; st: VState; changed: boolean }[] }[];
  out: string[];
  err?: string;
};
export type Preset = { name: string; code: string[]; steps: Raw[] };

const G = "global";
export const PRESETS: Preset[] = [
  {
    name: "var vs let",
    code: ["console.log(skor);", "var skor = 90;", "console.log(level);", "let level = 3;"],
    steps: [
      { line: -1, note: "Fase pembuatan: skor (var) diangkat dan diisi undefined. level (let) dikenali tapi masuk temporal dead zone.", ops: [{ open: G }, { s: G, v: "skor", val: "undefined", st: "undef" }, { s: G, v: "level", val: "TDZ", st: "tdz" }] },
      { line: 0, note: "skor sudah ada tapi belum bernilai: hasilnya undefined, bukan error.", ops: [], out: "undefined" },
      { line: 1, note: "Baru di baris ini skor diberi nilai 90.", ops: [{ s: G, v: "skor", val: "90", st: "val" }] },
      { line: 2, note: "level masih di temporal dead zone. Mengaksesnya sebelum barisnya jalan memicu ReferenceError.", ops: [], err: "ReferenceError: Cannot access 'level' before initialization" },
    ],
  },
  {
    name: "Declaration vs expression",
    code: ["console.log(tambah(2, 3));", "console.log(kurang(5, 1));", "function tambah(a, b) { return a + b; }", "const kurang = function (a, b) { return a - b; };"],
    steps: [
      { line: -1, note: "Function declaration terangkat utuh beserta isinya. kurang disimpan di const, jadi ikut aturan TDZ.", ops: [{ open: G }, { s: G, v: "tambah", val: "ƒ tambah", st: "fn" }, { s: G, v: "kurang", val: "TDZ", st: "tdz" }] },
      { line: 0, note: "tambah sudah siap dipakai walau ditulis di bawah.", ops: [], out: "5" },
      { line: 1, note: "kurang belum diinisialisasi. Function expression tidak terangkat seperti declaration.", ops: [], err: "ReferenceError: Cannot access 'kurang' before initialization" },
    ],
  },
  {
    name: "Closure dan blok",
    code: [
      "function buatPenghitung() {",
      "  let hitung = 0;",
      "  return () => ++hitung;",
      "}",
      "const klik = buatPenghitung();",
      "console.log(klik());",
      "console.log(klik());",
      "if (true) { let blok = 1; }",
      "console.log(blok);",
    ],
    steps: [
      { line: -1, note: "Fase pembuatan: buatPenghitung terangkat utuh, klik (const) masuk TDZ.", ops: [{ open: G }, { s: G, v: "buatPenghitung", val: "ƒ", st: "fn" }, { s: G, v: "klik", val: "TDZ", st: "tdz" }] },
      { line: 4, note: "Memanggil buatPenghitung() membuat scope fungsi baru. hitung dikenali tapi belum diisi.", ops: [{ open: "buatPenghitung()" }, { s: "buatPenghitung()", v: "hitung", val: "TDZ", st: "tdz" }] },
      { line: 1, note: "hitung diisi 0.", ops: [{ s: "buatPenghitung()", v: "hitung", val: "0", st: "val" }] },
      { line: 2, note: "Fungsi dalam dikembalikan. Fungsi luar selesai, tapi scope-nya tetap hidup karena fungsi dalam masih memakai hitung. Itu closure.", ops: [{ close: "buatPenghitung()", keep: true }, { s: G, v: "klik", val: "ƒ (ingat hitung)", st: "fn" }] },
      { line: 5, note: "klik() menaikkan hitung milik scope yang diingatnya.", ops: [{ s: "buatPenghitung()", v: "hitung", val: "1", st: "val" }], out: "1" },
      { line: 6, note: "Panggilan kedua melanjutkan dari nilai yang sama.", ops: [{ s: "buatPenghitung()", v: "hitung", val: "2", st: "val" }], out: "2" },
      { line: 7, note: "Blok if membuka block scope. let blok hanya hidup di dalamnya.", ops: [{ open: "blok { }" }, { s: "blok { }", v: "blok", val: "1", st: "val" }] },
      { line: 7, note: "Blok selesai, scope-nya dibuang.", ops: [{ close: "blok { }" }] },
      { line: 8, note: "blok sudah tidak terlihat dari luar blok.", ops: [], err: "ReferenceError: blok is not defined" },
    ],
  },
];

export function run(p: Preset): Snap[] {
  const scopes: Snap["scopes"] = [];
  const out: string[] = [];
  return p.steps.map((st, i) => {
    scopes.forEach((s) => s.vars.forEach((v) => (v.changed = false)));
    for (const op of st.ops) {
      if ("open" in op) scopes.push({ name: op.open, kept: false, vars: [] });
      else if ("close" in op) {
        const k = scopes.findIndex((s) => s.name === op.close);
        if (op.keep) scopes[k].kept = true;
        else scopes.splice(k, 1);
      } else {
        const sc = scopes.find((s) => s.name === op.s)!;
        const ex = sc.vars.find((v) => v.name === op.v);
        if (ex) Object.assign(ex, { val: op.val, st: op.st, changed: true });
        else sc.vars.push({ name: op.v, val: op.val, st: op.st, changed: true });
      }
    }
    if (st.out !== undefined) out.push(st.out);
    return {
      line: st.line, note: st.note, phase: i === 0 ? "creation" : "eksekusi", err: st.err, out: [...out],
      scopes: scopes.map((s) => ({ ...s, vars: s.vars.map((v) => ({ ...v })) })),
    };
  });
}
