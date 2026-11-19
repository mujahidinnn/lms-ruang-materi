import { useMemo, useState } from "react";
import Frame, { simButton, simChip, simGhost } from "./Frame";
import { PRESETS, clampNilai, code, gradeOf, lineOfBranch, trace, type Mark } from "../../../lib/sim/python-percabangan";

const TONE: Record<Mark, string> = { pending: "#5c5e54", true: "#b5d36f", false: "#ff8a7a", skip: "#3c3e36" };
const LABEL: Record<Mark, string> = { pending: "belum dicek", true: "True", false: "False", skip: "dilewati" };

export default function PythonPercabangan({ title }: { title: string }) {
  const [pi, setPi] = useState(0);
  const [nilai, setNilai] = useState(78);
  const [n, setN] = useState(0);
  const p = PRESETS[pi];
  const steps = useMemo(() => trace(p, nilai), [p, nilai]);
  const lines = useMemo(() => code(p, nilai), [p, nilai]);
  const s = steps[Math.min(n, steps.length - 1)];
  const done = n >= steps.length - 1;
  const nb = p.branches.length;
  const expected = gradeOf(PRESETS[0], nilai);
  const wrong = s.done && s.grade !== expected;
  const setVal = (v: number) => { setNilai(clampNilai(v)); setN(0); };

  // status per baris: baris cabang yang dilewati/ belum dicapai diredupkan
  const dim = (i: number) => {
    for (let b = 0; b <= nb; b++) {
      const m = b < nb ? s.marks[b] : s.elseMark;
      if ((i === 2 + 2 * b || i === 3 + 2 * b) && m === "skip") return true;
    }
    return false;
  };

  return (
    <Frame title={title} hint="Atur nilai, lalu maju satu langkah. Python mengecek dari atas dan berhenti di kondisi pertama yang True.">
      <div className="flex flex-wrap gap-1 rounded-3xl bg-zinc-800 p-1" role="group" aria-label="Contoh kode">
        {PRESETS.map((x, i) => <button key={x.name} type="button" aria-pressed={pi === i} onClick={() => { setPi(i); setN(0); }} className={`${simChip} grow`}>{x.name}</button>)}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-h-11 grow items-center gap-3 text-sm font-bold">
            <span className="font-mono">nilai = {nilai}</span>
            <input type="range" min={0} max={100} value={nilai} onChange={(e) => setVal(+e.target.value)} className="min-w-0 grow accent-[#b5d36f]" aria-label="Nilai ujian" />
          </label>
          <input type="number" min={0} max={100} inputMode="numeric" value={nilai} onChange={(e) => setVal(+e.target.value)} className="min-h-11 w-20 rounded-lg border-2 border-zinc-600 bg-black/40 px-2 text-center font-mono text-sm font-bold" aria-label="Ketik nilai" />
        </div>
        <p className="mt-1 text-xs text-zinc-400">{p.hint}</p>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <pre className="overflow-x-auto rounded-lg bg-black/40 py-2 text-xs sm:text-sm" aria-label="Kode contoh">
            {lines.map((l, i) => (
              <code key={i} className={`block min-h-[1.25em] px-3 whitespace-pre ${i === s.line ? "bg-[#b5d36f]/20 font-bold text-[#b5d36f]" : dim(i) ? "text-zinc-600" : "text-zinc-300"}`}>{l || " "}</code>
            ))}
          </pre>

          <ol className="flex flex-col items-stretch gap-1.5" aria-label="Diagram alur">
            {[...p.branches.map((b, i) => ({ q: `nilai >= ${b.thr}?`, r: `grade = ${b.grade}`, m: s.marks[i] as Mark, line: lineOfBranch(i) })), { q: "else", r: `grade = ${p.elseGrade}`, m: s.elseMark, line: 2 + 2 * nb }].map((x, i) => {
              const active = s.line === x.line;
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className={`flex min-h-11 grow items-center justify-between rounded-xl border-2 px-3 font-mono text-xs font-bold ${active ? "sim-pop" : ""}`} style={{ borderColor: TONE[x.m], color: x.m === "skip" ? "#5c5e54" : "#f4f7ea", background: active ? "rgb(181 211 111 / 0.15)" : "transparent" }}>
                    <span>{x.q}</span>
                    <span style={{ color: TONE[x.m] }}>{LABEL[x.m]}</span>
                  </span>
                  <span aria-hidden className="text-zinc-500">→</span>
                  <span className="w-24 shrink-0 rounded-lg px-2 py-2 text-center font-mono text-xs font-bold" style={{ background: x.m === "true" ? "#b5d36f" : "#2a2c25", color: x.m === "true" ? "#12140d" : "#5c5e54" }}>{x.r}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-3 rounded-xl bg-black/40 px-3 py-2 font-mono text-sm" aria-label="Output">
          <span className="text-zinc-500">output: </span>
          <span className="font-bold text-[#e8efd6]">{s.done ? `Nilai ${nilai} mendapat grade ${s.grade}` : "(kosong)"}</span>
        </div>
        <p role="status" className="mt-2 text-sm font-bold text-[#b5d36f]">{s.text}</p>
        {wrong && <p className="mt-1 text-sm font-bold text-[#ff8a7a]">Salah: urutan yang benar memberi grade {expected}. Cabang yang lebih ketat tidak pernah sempat dicek.</p>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={simButton} disabled={done} onClick={() => setN(n + 1)}>Langkah berikutnya</button>
        <button type="button" className={simGhost} disabled={n === 0} onClick={() => setN(n - 1)}>Mundur</button>
        <button type="button" className={simGhost} disabled={n === 0} onClick={() => setN(0)}>Ulangi</button>
        <span className="text-sm text-zinc-400">Langkah {Math.min(n, steps.length - 1) + 1} dari {steps.length}</span>
      </div>
    </Frame>
  );
}
