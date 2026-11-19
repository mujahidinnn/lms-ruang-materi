import { useState } from "react";
import Frame, { G, simChip } from "./Frame";
import { BATAS_E2E, type Counts, hitung, PRESET } from "../../../lib/sim/piramida";

const LAYER: { k: keyof Counts; nama: string; warna: string; max: number }[] = [
  { k: "e2e", nama: "End-to-end", warna: "#ff8a80", max: 200 },
  { k: "integrasi", nama: "Integrasi", warna: "#f2c879", max: 200 },
  { k: "unit", nama: "Unit", warna: G, max: 400 },
];

const fmtWaktu = (d: number) => (d < 60 ? `${d.toFixed(1)} detik` : `${(d / 60).toFixed(1)} menit`);

export default function PiramidaTes({ title }: { title: string }) {
  const [c, setC] = useState<Counts>(PRESET.piramida);
  const r = hitung(c);
  const maxBar = Math.max(c.unit, c.integrasi, c.e2e, 1);
  const preset = Object.entries(PRESET).find(([, p]) => p.unit === c.unit && p.integrasi === c.integrasi && p.e2e === c.e2e)?.[0];

  return (
    <Frame title={title} hint="Atur jumlah tes tiap lapisan. Waktu, biaya, dan risiko tes goyah dihitung dari model sederhana.">
      <div role="group" aria-label="Contoh proporsi" className="flex flex-wrap gap-1 rounded-3xl bg-zinc-800 p-1">
        {Object.entries(PRESET).map(([nama, p]) => <button key={nama} type="button" aria-pressed={preset === nama} onClick={() => setC(p)} className={`${simChip} grow capitalize`}>{nama}</button>)}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <div className="space-y-2" role="img" aria-label={`Unit ${c.unit}, integrasi ${c.integrasi}, end-to-end ${c.e2e}`}>
          {LAYER.map((l) => (
            <div key={l.k} className="mx-auto h-9 rounded-lg transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${Math.max(14, (c[l.k] / maxBar) * 100)}%`, background: l.warna }}>
              <span className="flex h-full items-center justify-center truncate px-2 text-xs font-extrabold text-[#12140d]">{l.nama} {c[l.k]}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-1">
          {LAYER.map((l) => (
            <label key={l.k} className="flex min-h-11 items-center gap-3 text-sm font-bold">
              <span className="w-24 shrink-0">{l.nama}</span>
              <input type="range" min={0} max={l.max} value={c[l.k]} onChange={(e) => setC({ ...c, [l.k]: Number(e.target.value) })} aria-label={`Jumlah tes ${l.nama}`} className="min-w-0 flex-1 accent-[#b5d36f]" />
              <span className="w-9 shrink-0 text-right tabular-nums">{c[l.k]}</span>
            </label>
          ))}
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {[["Total tes", String(r.total)], ["Waktu jalan", fmtWaktu(r.detik)], ["Biaya rawat", `${r.biaya.toFixed(0)} poin`], ["Peluang gagal acak", `${(r.flaky * 100).toFixed(0)}%`]].map(([a, b]) => (
            <div key={a} className="rounded-xl bg-black/40 px-3 py-2"><dt className="text-xs text-zinc-400">{a}</dt><dd className="text-base font-extrabold">{b}</dd></div>
          ))}
        </dl>

        {r.terlaluE2e && (
          <p role="alert" className="mt-3 rounded-xl border-2 border-[#ff8a80] bg-[#ff8a80]/10 px-3 py-2 text-sm font-bold text-[#ff8a80]">
            {Math.round(r.shareE2e * 100)}% tes berupa end-to-end (batas sehat {BATAS_E2E * 100}%). Pindahkan pemeriksaan aturan ke unit test.
          </p>
        )}
        <p className="mt-3 text-xs text-zinc-400">Model: unit 0,01 detik, integrasi 0,5 detik, E2E 15 detik per tes; biaya rawat 1, 5, dan 25 poin; peluang gagal acak 0,05%, 0,5%, dan 3% per tes. Angka perkiraan untuk belajar, bukan ukuran nyata.</p>
      </div>
    </Frame>
  );
}
