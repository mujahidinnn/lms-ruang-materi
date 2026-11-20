import { useMemo, useState } from "react";
import { bucket, data, EDGES, posisi, ringkas } from "@/lib/sim/persentil-latensi";
import Chips, { range } from "./Chips";
import Frame from "./Frame";

const N = [100, 500, 1000] as const;
const W = 480, X0 = 10, CH = 110, TOP = 46;
const bw = (W - 2 * X0) / EDGES.length;
const ms = (x: number) => String(Math.round(x * 10) / 10).replace(".", ",");
const MARK = [["rata-rata", "#ff8a78", "rata"], ["p50", "#7fb3d9", "p50"], ["p95", "#f0b36a", "p95"], ["p99", "#b5d36f", "p99"]] as const;

export default function PersentilLatensi({ title }: { title: string }) {
  const [n, setN] = useState<number>(500);
  const [ekor, setEkor] = useState(2);
  const d = useMemo(() => data(n, ekor), [n, ekor]);
  const r = ringkas(d);
  const c = bucket(d);
  const maks = Math.max(...c.map(Math.sqrt));
  const lambat = d.filter((x) => x > r.rata * 2).length;
  const x = (v: number) => X0 + posisi(v) * bw;

  return (
    <Frame title={title} hint="Geser ekor lambat dan jumlah request. Rata-rata nyaris tak bergerak, p99 melonjak.">
      <div className="sim-stage p-3">
        <svg viewBox={`0 0 ${W} 190`} role="img" aria-label={`Histogram ${n} request. rata-rata ${ms(r.rata)} ms, p50 ${r.p50} ms, p95 ${r.p95} ms, p99 ${r.p99} ms`} className="mx-auto block w-full max-w-xl">
          {c.map((v, i) => {
            const h = (Math.sqrt(v) / maks) * CH;
            return (
              <g key={i}>
                <rect x={X0 + i * bw + 2} y={TOP + CH - h} width={bw - 4} height={h} rx="2" fill={i < 4 ? "#7f8a64" : "#c9a15a"} />
                <text x={X0 + i * bw + bw / 2} y={TOP + CH - h - 3} textAnchor="middle" className="fill-zinc-300 font-mono text-[9px]">{v || ""}</text>
                <text x={X0 + i * bw + bw / 2} y={TOP + CH + 12} textAnchor="middle" className="fill-zinc-300 font-mono text-[9px]">{EDGES[i]}</text>
              </g>
            );
          })}
          <line x1={X0} x2={W - X0} y1={TOP + CH} y2={TOP + CH} stroke="#5c5e54" />
          <text x={W - X0} y="186" textAnchor="end" className="fill-zinc-400 text-[9px]">batas bucket (ms), tinggi bar skala akar</text>
          {MARK.map(([l, col, k], i) => {
            const px = x(r[k]);
            const anchor = px > W - 70 ? "end" : "start";
            return (
              <g key={l}>
                <line x1={px} x2={px} y1={12 + i * 8} y2={TOP + CH} stroke={col} strokeWidth="2" strokeDasharray={k === "rata" ? "4 3" : undefined} />
                <text x={px + (anchor === "end" ? -4 : 4)} y={20 + i * 8} textAnchor={anchor} fill={col} className="font-mono text-[9px] font-bold">{l} {ms(r[k])}</text>
              </g>
            );
          })}
        </svg>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          {MARK.map(([l, col, k]) => (
            <div key={l} className="rounded-xl bg-zinc-800 p-2"><dt className="text-xs" style={{ color: col }}>{l}</dt><dd className="font-mono text-lg font-bold">{ms(r[k])} ms</dd></div>
          ))}
        </dl>
        <p aria-live="polite" className="mt-3 min-h-12 text-center text-sm text-zinc-300">
          p99 adalah {ms(r.p99 / r.rata)} kali rata-rata. {lambat} dari {n} request ({ms((lambat / n) * 100)}%) lebih dari dua kali lebih lambat dari rata-rata, tapi rata-rata tidak menunjukkannya.
        </p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold">
          ekor lambat: {ms(ekor)}% request
          <input type="range" min={0} max={10} step={0.5} value={ekor} onChange={(e) => setEkor(+e.target.value)} className={range} />
        </label>
        <Chips label="jumlah request" value={n} options={N} onChange={setN} />
      </div>
    </Frame>
  );
}
