import { useState } from "react";
import { type Agg, groupAgg } from "../../../lib/sim/dataframe";
import Frame, { simChip } from "./Frame";

const DATA = [
  ["Bandung", "Kopi", 3], ["Jakarta", "Teh", 1], ["Bandung", "Kopi", 2], ["Jakarta", "Roti", 4],
  ["Bandung", "Teh", 2], ["Jakarta", "Kopi", 5], ["Bandung", "Roti", 1], ["Jakarta", "Susu", 2],
].map(([kota, produk, jumlah]) => ({ kota, produk, jumlah }));
const COLORS = ["#b5d36f", "#f2c879", "#8fc4e8", "#e59fb4"];
const COLS = ["kota", "produk"] as const;
const AGGS: Agg[] = ["sum", "mean", "count"];
const STEPS = ["1. Data asli", "2. Pecah", "3. Terapkan dan kumpulkan"];
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export default function GroupbyAgg({ title }: { title: string }) {
  const [by, setBy] = useState<(typeof COLS)[number]>("produk");
  const [agg, setAgg] = useState<Agg>("sum");
  const [step, setStep] = useState(0);
  const groups = groupAgg(DATA, by, "jumlah", agg);
  const colorOf = (i: number) => COLORS[groups.findIndex((g) => g.rows.includes(i)) % COLORS.length];
  const order = step === 0 ? DATA.map((_, i) => i) : groups.flatMap((g) => g.rows);
  const code = `df.groupby("${by}")["jumlah"].${agg}()`;

  return (
    <Frame title={title} hint="Pilih kolom pengelompok dan jenis agregasi, lalu maju per tahap: baris terpecah menjadi kelompok berwarna, lalu tiap kelompok menjadi satu baris.">
      <div className="grid gap-2 sm:grid-cols-2">
        <div role="group" aria-label="Kolom pengelompok" className="flex gap-1 rounded-full bg-zinc-800 p-1">
          {COLS.map((c) => <button key={c} type="button" aria-pressed={by === c} onClick={() => setBy(c)} className={`${simChip} flex-1`}>per {c}</button>)}
        </div>
        <div role="group" aria-label="Jenis agregasi" className="flex gap-1 rounded-full bg-zinc-800 p-1">
          {AGGS.map((a) => <button key={a} type="button" aria-pressed={agg === a} onClick={() => setAgg(a)} className={`${simChip} flex-1`}>{a}</button>)}
        </div>
      </div>

      <div role="group" aria-label="Tahap" className="mt-2 grid grid-cols-3 gap-1 rounded-2xl bg-zinc-800 p-1">
        {STEPS.map((s, i) => <button key={s} type="button" aria-pressed={step === i} onClick={() => setStep(i)} className={`${simChip} !rounded-xl !px-1 text-xs sm:text-sm`}>{s}</button>)}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <pre className="overflow-x-auto rounded-xl bg-[#0a0c06] p-3 font-mono text-xs text-[#e8efd6]" aria-label="Kode pandas">{code}</pre>
        {step < 2 ? (
          <table className="mt-3 w-full border-separate border-spacing-y-1 font-mono text-xs">
            <thead><tr className="text-left font-sans text-zinc-400"><th className="px-2">kota</th><th className="px-2">produk</th><th className="px-2">jumlah</th></tr></thead>
            <tbody>
              {order.map((i) => {
                const r = DATA[i];
                const c = colorOf(i);
                return (
                  <tr key={i} className="sim-pop bg-zinc-800/70" style={step === 1 ? { boxShadow: `inset 4px 0 0 ${c}` } : undefined}>
                    {[r.kota, r.produk, r.jumlah].map((v, k) => (
                      <td key={k} className={`px-2 py-2 ${k === 0 ? "rounded-l-lg" : ""} ${k === 2 ? "rounded-r-lg" : ""}`} style={step === 1 && String(v) === groups.find((g) => g.rows.includes(i))?.key ? { color: c, fontWeight: 700 } : undefined}>{v}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="mt-3 w-full border-separate border-spacing-y-1 font-mono text-xs">
            <thead><tr className="text-left font-sans text-zinc-400"><th className="px-2">{by}</th><th className="px-2">jumlah ({agg})</th><th className="px-2">dari baris</th></tr></thead>
            <tbody>
              {groups.map((g, k) => (
                <tr key={g.key} className="sim-pop bg-zinc-800/70" style={{ boxShadow: `inset 4px 0 0 ${COLORS[k % COLORS.length]}` }}>
                  <td className="rounded-l-lg px-2 py-2 font-bold" style={{ color: COLORS[k % COLORS.length] }}>{g.key}</td>
                  <td className="px-2 py-2 text-base font-bold">{fmt(g.value)}</td>
                  <td className="rounded-r-lg px-2 py-2 text-zinc-400">{g.rows.length} baris</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p aria-live="polite" className="mt-3 min-h-10 text-sm text-zinc-300">
        {step === 0 && `${DATA.length} baris transaksi. Kolom ${by} berisi ${groups.length} nilai berbeda.`}
        {step === 1 && `Tahap pecah: baris dengan ${by} yang sama dikumpulkan jadi ${groups.length} kelompok, satu warna per kelompok.`}
        {step === 2 && `Tahap terapkan: ${agg} dihitung pada kolom jumlah di tiap kelompok, hasilnya ${groups.length} baris.`}
      </p>
    </Frame>
  );
}
