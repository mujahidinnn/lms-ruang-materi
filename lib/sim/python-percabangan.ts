export type Branch = { thr: number; grade: string };
export type Preset = { name: string; branches: Branch[]; elseGrade: string; hint: string };
export type Mark = "pending" | "true" | "false" | "skip";
export type PStep = { line: number; marks: Mark[]; elseMark: Mark; grade: string | null; done: boolean; text: string };

export const PRESETS: Preset[] = [
  { name: "Urutan benar", branches: [{ thr: 85, grade: "A" }, { thr: 70, grade: "B" }, { thr: 55, grade: "C" }], elseGrade: "D", hint: "Kondisi paling ketat di atas: setiap nilai jatuh ke grade yang pas." },
  { name: "Urutan terbalik", branches: [{ thr: 55, grade: "C" }, { thr: 70, grade: "B" }, { thr: 85, grade: "A" }], elseGrade: "D", hint: "Kondisi longgar di atas: nilai 55 ke atas langsung berhenti di C, cabang B dan A tidak pernah tercapai." },
];

export const clampNilai = (n: number) => (Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0);

// Nomor baris: 0 nilai=, 1 kosong, cabang i di 2+2i (kondisi) dan 3+2i (isi), else di 2+2n dan 3+2n, lalu kosong dan print.
export const lineOfBranch = (i: number) => 2 + 2 * i;

export function code(p: Preset, nilai: number): string[] {
  const out = [`nilai = ${nilai}`, ""];
  p.branches.forEach((b, i) => {
    out.push(`${i === 0 ? "if" : "elif"} nilai >= ${b.thr}:`, `    grade = "${b.grade}"`);
  });
  out.push("else:", `    grade = "${p.elseGrade}"`, "", `print(f"Nilai {nilai} mendapat grade {grade}")`);
  return out;
}

export function gradeOf(p: Preset, nilai: number): string {
  for (const b of p.branches) if (nilai >= b.thr) return b.grade;
  return p.elseGrade;
}

export function trace(p: Preset, nilai: number): PStep[] {
  const n = p.branches.length;
  const marks: Mark[] = p.branches.map(() => "pending");
  let elseMark: Mark = "pending";
  const steps: PStep[] = [];
  const push = (line: number, grade: string | null, done: boolean, text: string) =>
    steps.push({ line, marks: [...marks], elseMark, grade, done, text });
  push(0, null, false, `nilai diisi ${nilai}.`);
  for (let i = 0; i < n; i++) {
    const b = p.branches[i];
    const ok = nilai >= b.thr;
    marks[i] = ok ? "true" : "false";
    push(lineOfBranch(i), null, false, `${nilai} >= ${b.thr} bernilai ${ok ? "True" : "False"}${ok ? ": blok ini dijalankan." : ": lanjut ke bawah."}`);
    if (ok) {
      for (let j = i + 1; j < n; j++) marks[j] = "skip";
      elseMark = "skip";
      push(lineOfBranch(i) + 1, b.grade, false, `grade = "${b.grade}". Cabang di bawahnya dilewati tanpa dicek.`);
      push(3 + 2 * n + 2, b.grade, true, `Nilai ${nilai} mendapat grade ${b.grade}.`);
      return steps;
    }
  }
  elseMark = "true";
  push(2 + 2 * n, null, false, "Semua kondisi False, jadi else yang jalan.");
  push(3 + 2 * n, p.elseGrade, false, `grade = "${p.elseGrade}".`);
  push(3 + 2 * n + 2, p.elseGrade, true, `Nilai ${nilai} mendapat grade ${p.elseGrade}.`);
  return steps;
}
