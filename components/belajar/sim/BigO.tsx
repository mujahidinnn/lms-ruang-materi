import { useEffect, useState } from "react";
import { CLASSES, fmt } from "../../../lib/sim/bigo";
import Frame, { simButton, simChip, simGhost } from "./Frame";

const W = 400, H = 220, PAD = 10, MAX_N = 100;

export default function BigO({ title }: { title: string }) {
  const [n, setN] = useState(16);
  const [log, setLog] = useState(false);
  const [sweep, setSweep] = useState(false);
  const sweeping = sweep && n < MAX_N;
  useEffect(() => {
    if (!sweeping) return;
    const t = setTimeout(() => setN(n + 1), 90);
    return () => clearTimeout(t);
  }, [sweeping, n]);

  const xs = Math.max(n, 2);
  const vals = CLASSES.map((c) => c.f(n));
  const top = Math.max(...vals);
  const yMaxLin = Math.max(8, n * Math.log2(Math.max(n, 2)) * 1.2);
  const yMaxLog = Math.log10(1 + Math.min(top, 1e30));
  const y = (v: number) => {
    const t = log ? Math.log10(1 + v) / yMaxLog : Math.min(v / yMaxLin, 1.15);
    return H - PAD - t * (H - 2 * PAD);
  };
  const path = (f: (n: number) => number) =>
    Array.from({ length: xs }, (_, k) => `${k ? "L" : "M"}${(PAD + (k / (xs - 1)) * (W - 2 * PAD)).toFixed(1)} ${y(f(k + 1)).toFixed(1)}`).join("");

  return (
    <Frame title={title} hint="Geser n dan lihat enam kelas kompleksitas menjauh satu sama lain. Garis yang keluar bingkai sudah di luar skala.">
      <div className="sim-stage p-3 sm:p-4">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Grafik pertumbuhan langkah untuk n sampai ${n}`} className="h-auto w-full overflow-hidden rounded-xl bg-[#0a0c06]">
          {[0.25, 0.5, 0.75].map((t) => <line key={t} x1="0" x2={W} y1={H * t} y2={H * t} stroke="#2c3418" strokeWidth="1" />)}
          {CLASSES.map((c) => <path key={c.id} d={path(c.f)} fill="none" stroke={c.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />)}
          <text x={W - 6} y={H - 14} fontSize="9" fill="#8a9171" textAnchor="end">n = 1 sampai {xs}</text>
          <text x="6" y="12" fontSize="9" fill="#8a9171">{log ? "langkah (skala logaritmik)" : "langkah (skala linear)"}</text>
        </svg>

        <table className="mt-3 w-full text-sm">
          <caption className="sr-only">Perkiraan jumlah langkah untuk n = {n}</caption>
          <thead><tr className="text-left text-xs text-zinc-400"><th className="py-1 font-bold">Kelas</th><th className="py-1 text-right font-bold">Langkah saat n = {n}</th></tr></thead>
          <tbody>
            {CLASSES.map((c, i) => (
              <tr key={c.id} className="border-t border-zinc-700/60">
                <td className="py-1.5"><span className="mr-2 inline-block size-2.5 rounded-full align-middle" style={{ background: c.color }} /><span className="font-bold">{c.label}</span> <span className="text-xs text-zinc-400">{c.name}</span></td>
                <td className="py-1.5 text-right font-bold tabular-nums">{fmt(vals[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm font-bold">Ukuran masukan n: {n}
          <input type="range" min={1} max={MAX_N} value={n} onChange={(e) => { setSweep(false); setN(+e.target.value); }} className="min-h-11 w-full accent-[var(--color-matcha-400)]" aria-label="Ukuran masukan n" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={simButton} onClick={() => { if (sweeping) setSweep(false); else { if (n >= MAX_N) setN(1); setSweep(true); } }} aria-label={sweeping ? "Jeda animasi" : "Putar animasi n bertambah"}>{sweeping ? "Jeda" : "Putar n"}</button>
          <button type="button" className={simGhost} onClick={() => { setSweep(false); setN(16); }} aria-label="Kembalikan n ke 16">Ulang</button>
          <div role="group" aria-label="Skala sumbu" className="flex gap-1 rounded-full bg-zinc-800 p-1">
            <button type="button" className={simChip} aria-pressed={!log} onClick={() => setLog(false)}>Linear</button>
            <button type="button" className={simChip} aria-pressed={log} onClick={() => setLog(true)}>Logaritmik</button>
          </div>
        </div>
      </div>
    </Frame>
  );
}
