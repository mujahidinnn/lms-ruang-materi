import { useState } from "react";
import { jalankan, ringkas, TAHAP, type Fn, type Having, type Kolom, type Opsi, type Where } from "@/lib/sim/sql-groupby-having";
import Frame, { simButton, simGhost } from "./Frame";
import Chips from "./Chips";

const KOLOM = ["tanpa", "kota", "produk"] as const;
const FN = ["COUNT", "SUM", "AVG"] as const;
const WHERE = ["tanpa", "qty >= 3", "produk <> 'Roti'"] as const;
const HAVING = ["tanpa", "> 2", "> 4", "> 10"] as const;
const WARNA = ["#b5d36f", "#7fb3d9", "#f0b36a", "#d7a6ea"];
const KLAUSA = ["from", "where", "group", "having", "select"];
const th = "px-2 py-1 text-left text-xs font-bold text-zinc-400";
const td = "px-2 py-1 font-mono text-xs";

export default function SqlGroupbyHaving({ title }: { title: string }) {
  const [o, setO] = useState<Opsi>({ kolom: "kota", fn: "SUM", where: "tanpa", having: "tanpa" });
  const [t, setT] = useState(0);
  const r = jalankan(o);
  const ubah = (p: Partial<Opsi>) => { setO((x) => ({ ...x, ...p })); };
  const hasilKosong = t === 4 && r.hasil.length === 0;
  const kolomTampil = o.kolom === "tanpa" ? "kelompok" : o.kolom;

  return (
    <Frame title={title} hint="Pilih kolom pengelompok, fungsi agregat, WHERE, dan HAVING. Lalu maju tahap demi tahap untuk melihat urutan SQL benar-benar dijalankan.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Chips<Kolom> label="GROUP BY" value={o.kolom} options={KOLOM} onChange={(v) => ubah({ kolom: v })} />
        <Chips<Fn> label="Fungsi agregat atas qty" value={o.fn} options={FN} onChange={(v) => ubah({ fn: v })} />
        <Chips<Where> label="WHERE (sebelum grup)" value={o.where} options={WHERE} onChange={(v) => ubah({ where: v })} />
        <Chips<Having> label="HAVING hasil agregat (sesudah grup)" value={o.having} options={HAVING} onChange={(v) => ubah({ having: v })} />
      </div>
      <pre aria-label="Kueri SQL yang dihasilkan" className="mt-3 overflow-x-auto rounded-xl bg-[#0a0c06] p-3 font-mono text-xs leading-relaxed text-matcha-300">
        {r.sql.map((l) => (
          <span key={l.klausa} className={`block rounded px-1 ${KLAUSA[t] === l.klausa ? "bg-matcha-300 font-bold text-noir" : ""}`}>{l.teks}{l.klausa === r.sql[r.sql.length - 1].klausa ? ";" : ""}</span>
        ))}
      </pre>
      <div role="group" aria-label="Tahap eksekusi" className="mt-3 flex flex-wrap gap-1 rounded-2xl border-2 border-noir bg-zinc-800 p-1">
        {TAHAP.map((x, i) => (
          <button key={x} type="button" aria-pressed={t === i} onClick={() => setT(i)} className="min-h-11 rounded-full px-3 text-sm font-bold text-zinc-300 aria-pressed:bg-noir aria-pressed:text-on-noir">{x}</button>
        ))}
      </div>
      <div className="sim-stage mt-3 p-3">
        {t <= 1 && (
          <div className="overflow-x-auto">
            <table aria-label={t === 0 ? "Baris awal" : "Baris setelah WHERE"} className="w-full border-collapse">
              <thead><tr><th className={th}>id</th><th className={th}>kota</th><th className={th}>produk</th><th className={th}>qty</th><th className={th}></th></tr></thead>
              <tbody>
                {r.awal.map((b) => {
                  const buang = t === 1 && !r.lolosWhere.includes(b);
                  return (
                    <tr key={b.id} className={`border-t border-zinc-800 ${buang ? "text-zinc-600 line-through" : "text-zinc-200"}`}>
                      <td className={td}>{b.id}</td><td className={td}>{b.kota}</td><td className={td}>{b.produk}</td><td className={td}>{b.qty}</td>
                      <td className="px-2 py-1 text-xs no-underline">{buang ? <span className="inline-block text-[#ff8a80]">dibuang</span> : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {(t === 2 || t === 3) && (
          <ul aria-label={t === 2 ? "Kelompok" : "Kelompok setelah HAVING"} className="grid gap-2 sm:grid-cols-2">
            {r.kelompok.map((g, i) => {
              const buang = t === 3 && !g.lolos;
              return (
                <li key={g.kunci} style={{ borderColor: buang ? "#52525b" : WARNA[i % WARNA.length] }} className={`rounded-xl border-2 p-2 ${buang ? "opacity-50" : ""}`}>
                  <p className="flex items-center justify-between gap-2 text-sm font-bold">
                    <span style={{ color: WARNA[i % WARNA.length] }}>{o.kolom === "tanpa" ? g.kunci : `${o.kolom} = ${g.kunci}`}</span>
                    <span className="text-xs font-normal text-zinc-400">{g.baris.length} baris</span>
                  </p>
                  <p className="mt-1 flex flex-wrap gap-1">
                    {g.baris.map((b) => <span key={b.id} className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-200">#{b.id}:{b.qty}</span>)}
                  </p>
                  {t === 3 && (
                    <p className={`mt-2 font-mono text-xs font-bold ${buang ? "text-[#ff8a80]" : "text-matcha-300"}`}>
                      {o.fn}(qty) = {g.nilai}{o.having !== "tanpa" ? (buang ? ` (tidak ${o.having}, dibuang)` : ` (lolos ${o.having})`) : ""}
                    </p>
                  )}
                </li>
              );
            })}
            {r.kelompok.length === 0 && <li className="text-sm text-zinc-400">Tidak ada baris tersisa, jadi tidak ada kelompok.</li>}
          </ul>
        )}
        {t === 4 && (
          <div className="overflow-x-auto">
            <table aria-label="Hasil akhir" className="w-full border-collapse">
              <thead><tr><th className={th}>{kolomTampil === "kelompok" ? "" : kolomTampil}</th><th className={th}>hasil</th></tr></thead>
              <tbody>
                {r.hasil.map((g) => <tr key={g.kunci} className="border-t border-zinc-800 text-zinc-200"><td className={td}>{o.kolom === "tanpa" ? "" : g.kunci}</td><td className={`${td} font-bold text-matcha-300`}>{g.nilai}</td></tr>)}
                {hasilKosong && <tr><td colSpan={2} className="px-2 py-2 text-sm text-zinc-400">kosong</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p aria-live="polite" className="mt-2 min-h-12 text-sm text-zinc-300">{ringkas(o, t)}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={t === 0} onClick={() => setT(t - 1)} className={simGhost}>Mundur</button>
        <button type="button" disabled={t === 4} onClick={() => setT(t + 1)} className={simButton}>Maju</button>
      </div>
    </Frame>
  );
}
