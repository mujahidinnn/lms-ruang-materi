import { useMemo, useState } from "react";
import Frame, { simButton, simChip, simGhost } from "./Frame";
import { CAP, code, trace, type Kind } from "../../../lib/sim/python-loop";

const KINDS: { id: Kind; name: string }[] = [
  { id: "for", name: "for range" },
  { id: "sum", name: "Penjumlah" },
  { id: "while", name: "while" },
];

export default function PythonLoop({ title }: { title: string }) {
  const [kind, setKind] = useState<Kind>("for");
  const [noInc, setNoInc] = useState(false);
  const [n, setN] = useState(0);
  const ni = kind === "while" && noInc;
  const steps = useMemo(() => trace(kind, ni), [kind, ni]);
  const lines = useMemo(() => code(kind, ni), [kind, ni]);
  const s = steps[n];
  const done = n === steps.length - 1;

  return (
    <Frame title={title} hint="Maju satu langkah. Perhatikan baris yang menyala, isi variabel, dan jumlah putaran.">
      <div className="flex flex-wrap gap-1 rounded-3xl bg-zinc-800 p-1" role="group" aria-label="Contoh perulangan">
        {KINDS.map((k) => <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => { setKind(k.id); setN(0); }} className={`${simChip} grow`}>{k.name}</button>)}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <pre className="overflow-x-auto rounded-lg bg-black/40 py-2 text-xs sm:text-sm" aria-label="Kode contoh">
          {lines.map((l, i) => (
            <code key={i} className={`block px-3 whitespace-pre ${i === s.line ? "bg-[#b5d36f]/20 font-bold text-[#b5d36f]" : "text-zinc-300"}`}>{l}</code>
          ))}
        </pre>

        {kind === "while" && (
          <button type="button" aria-pressed={noInc} onClick={() => { setNoInc(!noInc); setN(0); }} className={`${simChip} mt-3 border-2 border-zinc-600`}>
            {noInc ? "Baris hitung -= 1 dihapus" : "Hapus baris hitung -= 1"}
          </button>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-black/40 p-3" aria-label="Tabel variabel">
            <p className="text-xs font-bold text-zinc-400">Variabel</p>
            <table className="mt-1 w-full font-mono text-sm">
              <tbody>
                {s.vars.map(([k, v]) => (
                  <tr key={k + v} className="sim-pop"><td className="text-zinc-300">{k}</td><td className="text-right font-bold text-[#b5d36f]">{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl bg-black/40 p-3">
            <p className="text-xs font-bold text-zinc-400">Putaran</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-[#e8efd6]" aria-label="Jumlah putaran">{s.iter}</p>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-black/40 px-3 py-2 font-mono text-sm" aria-label="Output">
          <span className="text-zinc-500">output:</span>
          <pre className="font-bold break-words whitespace-pre-wrap text-[#e8efd6]">{s.out || "(kosong)"}</pre>
        </div>
        <p role="status" className={`mt-2 text-sm font-bold ${s.stopped ? "text-[#ff8a7a]" : "text-[#b5d36f]"}`}>{s.note}</p>
        {ni && <p className="mt-1 text-xs text-zinc-400">Tanpa pengurangan, hitung tidak pernah mencapai 0. Simulasi memotong di {CAP} putaran.</p>}
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
