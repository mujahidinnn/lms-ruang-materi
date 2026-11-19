import { useState } from "react";
import { type Table, redundant, stepTables } from "../../../lib/sim/normalisasi";
import Frame, { simButton, simChip, simGhost } from "./Frame";

const STEPS = [
  { tab: "Awal", note: "Tabel awal: kolom produk, harga, dan qty berisi daftar. Satu sel memuat banyak nilai, jadi tabel ini belum 1NF." },
  { tab: "1NF", note: "1NF: setiap sel satu nilai. Pesanan 1 pecah jadi dua baris, tetapi nama dan kota Ani serta harga produk kini berulang (sel kuning)." },
  { tab: "2NF", note: "2NF: kolom yang hanya bergantung pada sebagian kunci pindah. Harga ikut produk, dan data pelanggan ikut id_pesanan. Kota Ani masih berulang di tabel pesanan." },
  { tab: "3NF", note: "3NF: kota bergantung pada pelanggan, bukan pesanan, jadi dipindah ke tabel pelanggan. Tidak ada lagi sel yang berulang: ubah satu data, cukup satu tempat." },
];

function Tbl({ tb, step }: { tb: Table; step: number }) {
  const red = redundant(tb);
  return (
    <div className="sim-pop min-w-0 overflow-x-auto rounded-xl bg-[#0a0c06] p-2">
      <p className="mb-1 font-sans text-xs font-bold text-[#b5d36f]">{tb.name}</p>
      <table className="w-full font-mono text-[11px]">
        <thead>
          <tr className="text-left text-zinc-400">
            {tb.cols.map((c) => <th key={c} className={`whitespace-nowrap px-1.5 py-1 font-bold ${tb.pk.includes(c) ? "underline underline-offset-2" : ""} ${tb.fk.includes(c) ? "italic" : ""}`}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {tb.rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j} className={`whitespace-nowrap px-1.5 py-1 ${red.has(`${i},${j}`) ? "rounded bg-[#f2c879]/30 text-[#f2c879]" : step === 0 && String(v).includes(",") ? "rounded bg-[#f08a7a]/25 text-[#f08a7a]" : "text-zinc-200"}`}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Normalisasi({ title }: { title: string }) {
  const [step, setStep] = useState(0);
  const tables = stepTables(step);
  const dup = tables.reduce((n, tb) => n + redundant(tb).size, 0);

  return (
    <Frame title={title} hint="Maju satu tahap untuk melihat satu tabel berantakan dipecah, dan sel yang berulang hilang.">
      <div role="group" aria-label="Tahap normalisasi" className="flex gap-1 rounded-full bg-zinc-800 p-1">
        {STEPS.map((s, i) => <button key={s.tab} type="button" aria-pressed={step === i} onClick={() => setStep(i)} className={`${simChip} flex-1 px-2`}>{s.tab}</button>)}
      </div>
      <div className="sim-stage mt-3 p-3 sm:p-4">
        <div key={step} className={`grid gap-3 ${tables.length > 3 ? "sm:grid-cols-2" : ""}`}>
          {tables.map((tb) => <Tbl key={tb.name} tb={tb} step={step} />)}
        </div>
        <p className="mt-3 text-xs text-zinc-400"><u>Garis bawah</u> = primary key, <i>miring</i> = foreign key. Sel berulang: <b className={dup ? "text-[#f2c879]" : "text-[#b5d36f]"}>{dup}</b></p>
      </div>
      <p aria-live="polite" className="mt-3 min-h-20 text-sm text-zinc-300">{STEPS[step].note}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className={simGhost}>Mundur</button>
        <button type="button" disabled={step === 3} onClick={() => setStep(step + 1)} className={simButton}>{step === 0 ? "Jadikan 1NF" : step === 1 ? "Jadikan 2NF" : "Jadikan 3NF"}</button>
      </div>
    </Frame>
  );
}
