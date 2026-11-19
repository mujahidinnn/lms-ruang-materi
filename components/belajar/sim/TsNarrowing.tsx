import { useState } from "react";
import Frame, { simButton, simChip, simGhost } from "./Frame";
import { PRESETS } from "../../../lib/sim/ts-narrowing";

export default function TsNarrowing({ title }: { title: string }) {
  const [pi, setPi] = useState(0);
  const [n, setN] = useState(0);
  const p = PRESETS[pi];
  const s = p.steps[n];
  const done = n === p.steps.length - 1;
  const narrowed = !s.err && !s.type.includes("|");

  return (
    <Frame title={title} hint="Maju satu langkah dan lihat tipe variabel menyempit setiap kali ada pengecekan.">
      <div className="flex flex-wrap gap-1 rounded-3xl bg-zinc-800 p-1" role="group" aria-label="Contoh kode">
        {PRESETS.map((x, i) => <button key={x.name} type="button" aria-pressed={pi === i} onClick={() => { setPi(i); setN(0); }} className={`${simChip} grow`}>{x.name}</button>)}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <pre className="overflow-x-auto rounded-lg bg-black/40 py-2 text-xs sm:text-sm" aria-label="Kode TypeScript">
          {p.code.map((l, i) => (
            <code key={i} className={`block px-3 whitespace-pre ${i === s.line ? (s.err ? "bg-[#ff8a7a]/20 text-[#ff8a7a]" : "bg-[#b5d36f]/20 text-[#b5d36f]") : "text-zinc-300"}`}>{l}</code>
          ))}
        </pre>

        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Tipe saat ini">
          <span className="font-mono text-sm font-bold text-zinc-300">{p.vari}:</span>
          <span key={`${pi}-${n}`} className="sim-pop max-w-full rounded-full px-3 py-1 font-mono text-xs font-bold break-words text-[#12140d] sm:text-sm" style={{ background: s.err ? "#f2c879" : narrowed ? "#b5d36f" : "#c9a8ff" }}>{s.type}</span>
        </div>

        {s.err ? (
          <p role="alert" className="mt-3 rounded-xl border-2 border-[#ff8a7a] bg-[#ff8a7a]/10 px-3 py-2 font-mono text-xs font-bold break-words text-[#ff8a7a]">error TS2339: {s.err}</p>
        ) : (
          <p className="mt-3 rounded-xl bg-black/40 px-3 py-2 font-mono text-xs font-bold text-[#b5d36f]">Tidak ada error. Anggota tipe ini boleh dipakai.</p>
        )}
        <p role="status" className="mt-2 text-sm font-bold text-[#e8efd6]">{s.note}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={simButton} disabled={done} onClick={() => setN(n + 1)}>Langkah berikutnya</button>
        <button type="button" className={simGhost} disabled={n === 0} onClick={() => setN(n - 1)}>Mundur</button>
        <button type="button" className={simGhost} disabled={n === 0} onClick={() => setN(0)}>Ulangi</button>
        <span className="text-sm text-zinc-400">Langkah {n + 1} dari {p.steps.length}</span>
      </div>
    </Frame>
  );
}
