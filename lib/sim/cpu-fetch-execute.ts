// CPU mini: siklus fetch, decode, execute. Murni, tanpa DOM.
export type Instr = { op: "LOAD" | "ADD" | "STORE" | "HALT"; arg?: number };
export type Sel = Instr | number;
export type Fase = "fetch" | "decode" | "execute";
export type Cpu = { pc: number; ir: Instr | null; acc: number; mem: Sel[]; fase: Fase; selesai: boolean; baca: number | null; tulis: number | null; langkah: number; pesan: string };

// alamat 0-4 program, 5-6 operand, 7 hasil
export const PROGRAM: Instr[] = [{ op: "LOAD", arg: 5 }, { op: "ADD", arg: 6 }, { op: "ADD", arg: 6 }, { op: "STORE", arg: 7 }, { op: "HALT" }];
export const ALAMAT_DATA = [5, 6, 7] as const;

export const teksInstr = (i: Instr) => (i.arg === undefined ? i.op : `${i.op} ${i.arg}`);

export const awal = (a = 5, b = 3): Cpu => ({ pc: 0, ir: null, acc: 0, mem: [...PROGRAM, a, b, 0], fase: "fetch", selesai: false, baca: null, tulis: null, langkah: 0, pesan: "CPU siap. PC menunjuk alamat 0. Tekan Langkah." });

export const ubahOperand = (s: Cpu, alamat: 5 | 6, nilai: number): Cpu => ({ ...s, mem: s.mem.map((x, i) => (i === alamat ? Math.max(0, Math.min(99, nilai)) : x)) });

const angka = (s: Cpu, a: number) => s.mem[a] as number;

export function langkah(s: Cpu): Cpu {
  if (s.selesai) return s;
  const n = { ...s, mem: [...s.mem], baca: null, tulis: null, langkah: s.langkah + 1 };
  if (s.fase === "fetch") {
    const ir = s.mem[s.pc] as Instr;
    return { ...n, ir, baca: s.pc, pc: s.pc + 1, fase: "decode", pesan: `Fetch: ambil instruksi di alamat ${s.pc} (${teksInstr(ir)}) ke IR. PC naik jadi ${s.pc + 1}.` };
  }
  const ir = s.ir as Instr;
  if (s.fase === "decode") {
    const arti = { LOAD: `salin isi alamat ${ir.arg} ke ACC`, ADD: `tambahkan isi alamat ${ir.arg} ke ACC`, STORE: `tulis isi ACC ke alamat ${ir.arg}`, HALT: "hentikan CPU" }[ir.op];
    return { ...n, fase: "execute", pesan: `Decode: ${teksInstr(ir)} artinya ${arti}.` };
  }
  const e = { ...n, fase: "fetch" as Fase };
  if (ir.op === "LOAD") return { ...e, acc: angka(s, ir.arg!), baca: ir.arg!, pesan: `Execute: ACC diisi ${angka(s, ir.arg!)} dari alamat ${ir.arg}.` };
  if (ir.op === "ADD") { const acc = s.acc + angka(s, ir.arg!); return { ...e, acc, baca: ir.arg!, pesan: `Execute: ACC jadi ${s.acc} + ${angka(s, ir.arg!)} = ${acc}.` }; }
  if (ir.op === "STORE") { e.mem[ir.arg!] = s.acc; return { ...e, tulis: ir.arg!, pesan: `Execute: nilai ${s.acc} ditulis ke alamat ${ir.arg}.` }; }
  return { ...e, selesai: true, pesan: `Execute: HALT. Program selesai, hasil ${angka(s, 7)} ada di alamat 7.` };
}
