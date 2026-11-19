import { useMemo, useState } from "react";
import { binarySteps, linearSteps, type SearchStep } from "../../../lib/sim/search";
import Frame, { G, simGhost } from "./Frame";
import { Controls, usePlayer } from "./Player";

const N = 16;
const mk = (rnd: boolean) => {
  let v = 2;
  return Array.from({ length: N }, () => (v += rnd ? 2 + Math.floor(Math.random() * 6) : 3));
};

function Row({ title, a, s, target, binary }: { title: string; a: number[]; s: SearchStep; target: number; binary: boolean }) {
  return (
    <div className="rounded-xl bg-[#1d2113] p-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-extrabold">{title}</p>
        <p className="text-sm text-zinc-400"><strong className="text-lg text-[#f4f7ea] tabular-nums">{s.cmp}</strong> perbandingan</p>
      </div>
      <div className="mt-2 grid grid-cols-8 gap-1 sm:grid-cols-16">
        {a.map((v, i) => {
          const live = i >= s.lo && i <= s.hi;
          const cur = i === s.at;
          const hit = s.done && i === s.found;
          const mark = binary && !s.done ? `${i === s.lo ? "[" : ""}${cur ? "▲" : ""}${i === s.hi ? "]" : ""}` : "";
          return (
            <div key={i} className="text-center">
              <div className={`grid h-9 place-items-center rounded-lg text-xs font-bold tabular-nums motion-safe:transition-colors ${hit ? "text-[#12140d]" : cur ? "text-[#12140d]" : live ? "text-[#f4f7ea]" : "text-zinc-600"}`} style={{ background: hit ? G : cur ? "#f2c879" : live ? "#3a4421" : "#171a10", outline: v === target && !hit ? "1.5px dashed #b5d36f88" : undefined }}>{v}</div>
              <div className="h-4 text-[11px] leading-4 font-bold text-[#f2c879]" aria-hidden>{mark}</div>
            </div>
          );
        })}
      </div>
      <p className="mt-1 min-h-10 text-sm" aria-live="polite">{s.note}</p>
    </div>
  );
}

export default function BinarySearch({ title }: { title: string }) {
  const [a, setA] = useState(() => mk(false));
  const [target, setTarget] = useState(() => mk(false)[11]);
  const lin = useMemo(() => linearSteps(a, target), [a, target]);
  const bin = useMemo(() => binarySteps(a, target), [a, target]);
  const p = usePlayer(Math.max(lin.length, bin.length));
  const options = [...a, a[6] + 1];

  return (
    <Frame title={title} hint="Pilih angka yang dicari, lalu jalankan dua pencarian sekaligus. Kolom abu-abu gelap sudah dibuang. [ ] menandai ruang yang tersisa, ▲ elemen tengah.">
      <div className="sim-stage grid gap-2 p-3 sm:p-4">
        <Row title="Linear" a={a} s={lin[Math.min(p.i, lin.length - 1)]} target={target} binary={false} />
        <Row title="Biner" a={a} s={bin[Math.min(p.i, bin.length - 1)]} target={target} binary />
      </div>
      <label className="mt-4 grid gap-1 text-sm font-bold">Angka yang dicari
        <select value={target} onChange={(e) => { setTarget(+e.target.value); p.reset(); }} aria-label="Angka yang dicari" className="min-h-11 rounded-full border-2 border-noir bg-zinc-800 px-4 text-sm font-bold">
          {options.map((v, i) => <option key={v} value={v}>{v}{i === N ? " (tidak ada di list)" : ""}</option>)}
        </select>
      </label>
      <Controls p={p}>
        <button type="button" className={simGhost} onClick={() => { const n = mk(true); setA(n); setTarget(n[Math.floor(Math.random() * N)]); p.reset(); }} aria-label="Buat list terurut baru">Data baru</button>
      </Controls>
    </Frame>
  );
}
