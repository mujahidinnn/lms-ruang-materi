import { useMemo, useState } from "react";
import { type Kind, KINDS, sortSteps } from "../../../lib/sim/sorting";
import Frame, { G, simGhost } from "./Frame";
import { Controls, usePlayer } from "./Player";

const N = 14;
const START = [58, 23, 91, 7, 74, 40, 15, 83, 31, 66, 49, 12, 97, 28];
const fresh = () => Array.from({ length: N }, () => 5 + Math.floor(Math.random() * 95));

export default function Sorting({ title }: { title: string }) {
  const [kind, setKind] = useState<Kind>("bubble");
  const [data, setData] = useState(START);
  const steps = useMemo(() => sortSteps(kind, data), [kind, data]);
  const p = usePlayer(steps.length);
  const s = steps[p.i];
  const info = KINDS.find((k) => k.id === kind)!;
  const swapLabel = kind === "merge" ? "Penulisan" : "Pertukaran";

  return (
    <Frame title={title} hint="Pilih algoritma, lalu putar atau maju satu langkah. Batang kuning sedang dibandingkan, hijau sudah di posisi akhirnya.">
      <div role="group" aria-label="Algoritma pengurutan" className="flex flex-wrap gap-1 rounded-2xl bg-zinc-800 p-1">
        {KINDS.map((k) => (
          <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => { setKind(k.id); p.reset(); }} className={`${simChipFix} flex-1`}>{k.label}</button>
        ))}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <div role="img" aria-label={`Batang data: ${s.arr.join(", ")}`} className="flex h-48 items-end gap-1">
          {s.arr.map((v, i) => {
            const hot = s.hi.includes(i);
            const ok = s.done.includes(i);
            return (
              <div key={i} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <span className="mb-0.5 text-center text-[10px] leading-none font-bold text-zinc-400">{v}</span>
                <div className="rounded-t-lg motion-safe:transition-[height,background-color] motion-safe:duration-150" style={{ height: `${v * 0.82}%`, background: hot ? "#f2c879" : ok ? G : "#6b7d3c", boxShadow: hot ? "0 0 12px #f2c87988" : undefined }} />
              </div>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-[#1d2113] py-2"><p className="text-2xl font-extrabold tabular-nums">{s.cmp}</p><p className="text-xs text-zinc-400">Perbandingan</p></div>
          <div className="rounded-xl bg-[#1d2113] py-2"><p className="text-2xl font-extrabold tabular-nums">{s.swp}</p><p className="text-xs text-zinc-400">{swapLabel}</p></div>
        </div>
      </div>
      <p className="mt-3 min-h-10 text-sm" aria-live="polite">{s.note}</p>
      <p className="text-xs text-zinc-400">Kompleksitas waktu {info.label.toLowerCase()} sort: {info.big}.{kind === "merge" ? " Di merge sort, penulisan = satu elemen ditaruh ke list hasil." : ""}</p>

      <Controls p={p}>
        <button type="button" className={simGhost} onClick={() => { setData(fresh()); p.reset(); }} aria-label="Buat data acak baru">Data baru</button>
      </Controls>
    </Frame>
  );
}

const simChipFix = "min-h-11 rounded-full px-3 text-sm font-bold text-zinc-300 aria-pressed:bg-[var(--color-matcha-300)] aria-pressed:text-[#12140d]";
