import { useMemo, useState } from "react";
import Frame, { simButton, simChip, simGhost } from "./Frame";
import { PRESETS, run, type VState } from "../../../lib/sim/scope-hoisting";

const TONE: Record<VState, string> = { tdz: "#ff8a7a", undef: "#f2c879", val: "#b5d36f", fn: "#c9a8ff" };

export default function ScopeHoisting({ title }: { title: string }) {
  const [pi, setPi] = useState(0);
  const [n, setN] = useState(0);
  const preset = PRESETS[pi];
  const steps = useMemo(() => run(preset), [preset]);
  const s = steps[n];
  const done = n === steps.length - 1;

  return (
    <Frame title={title} hint="Maju satu langkah. Lihat fase pembuatan mengangkat deklarasi lebih dulu, lalu kode berjalan baris demi baris.">
      <div className="flex flex-wrap gap-1 rounded-3xl bg-zinc-800 p-1" role="group" aria-label="Contoh kode">
        {PRESETS.map((p, i) => <button key={p.name} type="button" aria-pressed={pi === i} onClick={() => { setPi(i); setN(0); }} className={`${simChip} grow`}>{p.name}</button>)}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <pre className="overflow-x-auto rounded-lg bg-black/40 py-2 text-xs sm:text-sm" aria-label="Kode contoh">
          {preset.code.map((l, i) => (
            <code key={i} className={`block px-3 whitespace-pre ${i === s.line ? "bg-[#b5d36f]/20 text-[#b5d36f]" : "text-zinc-300"}`}>{l}</code>
          ))}
        </pre>

        <p className="mt-3 text-xs font-bold" style={{ color: s.phase === "creation" ? "#f2c879" : "#b5d36f" }}>
          {s.phase === "creation" ? "Fase pembuatan (sebelum baris pertama jalan)" : "Fase eksekusi"}
        </p>

        <div className="mt-2 flex flex-col gap-2" aria-label="Scope">
          {s.scopes.map((sc, i) => (
            <div key={sc.name} className="sim-pop rounded-xl border-2 border-dashed p-2" style={{ borderColor: sc.kept ? "#c9a8ff" : "#5c5e54", marginLeft: sc.name === "global" ? 0 : Math.min(i, 2) * 10 }}>
              <p className="text-[11px] font-bold text-zinc-300 sm:text-xs">
                {sc.name === "global" ? "Global scope" : sc.name.includes("{") ? `Block scope ${sc.name}` : `Function scope ${sc.name}`}
                {sc.kept && <span className="ml-2 text-[#c9a8ff]">selesai, tapi hidup lewat closure</span>}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {sc.vars.map((v) => (
                  <span key={v.name} className={`rounded-lg px-2 py-1 font-mono text-xs font-bold text-[#12140d] ${v.changed ? "sim-pop ring-2 ring-white" : ""}`} style={{ background: TONE[v.st] }}>
                    {v.name} = {v.val}
                  </span>
                ))}
                {sc.vars.length === 0 && <span className="text-xs text-zinc-500">(kosong)</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl bg-black/40 px-3 py-2 font-mono text-sm" aria-label="Output console">
          <span className="text-zinc-500">console: </span>
          <span className="font-bold text-[#e8efd6]">{s.out.length ? s.out.join("  ") : "(kosong)"}</span>
          {s.err && <p className="mt-1 font-bold break-words text-[#ff8a7a]">{s.err}</p>}
        </div>
        <p role="status" className="mt-2 text-sm font-bold text-[#b5d36f]">{s.note}</p>
        <p className="mt-2 text-xs text-zinc-400">
          <span style={{ color: TONE.undef }}>undefined</span> var terangkat, <span style={{ color: TONE.tdz }}>TDZ</span> let/const belum boleh diakses, <span style={{ color: TONE.fn }}>ƒ</span> fungsi.
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={simButton} disabled={done} onClick={() => setN(n + 1)}>Langkah berikutnya</button>
        <button type="button" className={simGhost} disabled={n === 0} onClick={() => setN(n - 1)}>Mundur</button>
        <button type="button" className={simGhost} disabled={n === 0} onClick={() => setN(0)}>Ulangi</button>
        <span className="text-sm text-zinc-400">Langkah {n + 1} dari {steps.length}</span>
      </div>
    </Frame>
  );
}
