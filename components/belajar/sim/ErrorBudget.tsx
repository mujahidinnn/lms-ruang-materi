import { useState } from "react";
import { fmt, hitung, MENIT, saran } from "@/lib/sim/error-budget";
import Frame, { simButton, simGhost, simChip } from "./Frame";

const SLO = [99, 99.9, 99.99] as const;
const DURASI = [5, 15, 30, 60] as const;
const WARNA = { aman: "#b5d36f", waspada: "#f0b36a", habis: "#ff8a78" } as const;
const SEG = ["#b5d36f", "#d6ea9c", "#96bb45", "#e8efd6"];

export default function ErrorBudget({ title }: { title: string }) {
  const [slo, setSlo] = useState<number>(99.9);
  const [dur, setDur] = useState<number>(15);
  const [ins, setIns] = useState<number[]>([]);
  const r = hitung(slo, ins);
  const warna = WARNA[r.status];
  const total = Math.max(r.budget, r.pakai);

  return (
    <Frame title={title} hint="Pilih SLO untuk periode 30 hari, lalu tambahkan insiden. Lihat budget menipis dan status berubah.">
      <div className="sim-stage p-3">
        <p className="text-center text-sm text-zinc-300">30 hari = {MENIT.toLocaleString("id-ID")} menit. SLO {fmt(slo)}% mengizinkan downtime</p>
        <p className="text-center font-mono text-2xl font-extrabold">{fmt(r.budget)} menit</p>
        <div role="img" aria-label={`Error budget: terpakai ${fmt(r.pakai)} dari ${fmt(r.budget)} menit, sisa ${fmt(r.sisa)} menit`} className="mt-3 flex h-10 overflow-hidden rounded-xl border-2 border-[#5c5e54] bg-[#191a16]">
          {ins.map((m, i) => (
            <div key={i} style={{ width: `${(m / total) * 100}%`, background: r.status === "habis" ? WARNA.habis : SEG[i % SEG.length] }} className="border-r border-[#12140d]" />
          ))}
          {r.sisa > 0 && <div style={{ width: `${(r.sisa / total) * 100}%` }} className="flex items-center justify-center bg-[#3c3e36] font-mono text-xs font-bold text-zinc-100">sisa {fmt(r.sisa)}</div>}
        </div>
        <p className="mt-1 text-center font-mono text-xs text-zinc-300">terpakai {fmt(r.pakai)} menit{r.lebih ? ` (melebihi ${fmt(r.lebih)})` : ""}</p>
        <div aria-live="polite" className="mt-3 rounded-xl p-2 text-center text-sm" style={{ border: `2px solid ${warna}` }}>
          <p className="font-extrabold uppercase" style={{ color: warna }}>{r.status} · sisa {fmt(r.persenSisa)}%</p>
          <p className="text-zinc-300">{saran[r.status]} ketersediaan aktual {fmt(r.aktual)}% (target {fmt(slo)}%).</p>
        </div>
        {ins.length > 0 && <p className="mt-2 text-center font-mono text-xs text-zinc-300">insiden: {ins.map((m) => `${m} mnt`).join(" + ")}</p>}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <span className="text-sm font-bold">SLO</span>
          <div role="group" aria-label="SLO" className="flex flex-wrap gap-1 rounded-2xl border-2 border-noir bg-zinc-800 p-1">
            {SLO.map((o) => <button key={o} type="button" aria-pressed={slo === o} onClick={() => setSlo(o)} className={simChip}>{fmt(o)}%</button>)}
          </div>
        </div>
        <div className="grid gap-1">
          <span className="text-sm font-bold">durasi insiden (menit)</span>
          <div role="group" aria-label="Durasi insiden" className="flex flex-wrap gap-1 rounded-2xl border-2 border-noir bg-zinc-800 p-1">
            {DURASI.map((o) => <button key={o} type="button" aria-pressed={dur === o} onClick={() => setDur(o)} className={simChip}>{o}</button>)}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setIns((o) => [...o, dur])} className={simButton}>Tambah insiden {dur} menit</button>
        <button type="button" disabled={!ins.length} onClick={() => setIns((o) => o.slice(0, -1))} className={simGhost}>Batalkan terakhir</button>
        <button type="button" disabled={!ins.length} onClick={() => setIns([])} className={simGhost}>Ulang</button>
      </div>
    </Frame>
  );
}
