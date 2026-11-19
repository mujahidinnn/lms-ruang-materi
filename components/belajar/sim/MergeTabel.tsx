import { useState } from "react";
import { type How, merge } from "../../../lib/sim/dataframe";
import Frame, { simChip } from "./Frame";

const PRODUK = [{ kode: "K01", nama: "Kopi", kategori: "Minuman" }, { kode: "T01", nama: "Teh", kategori: "Minuman" }, { kode: "R01", nama: "Roti", kategori: "Makanan" }];
const JUAL = [{ kode: "K01", jumlah: 2 }, { kode: "R01", jumlah: 1 }, { kode: "K01", jumlah: 3 }, { kode: "X99", jumlah: 1 }];
const HOWS: How[] = ["inner", "left", "outer"];
const NAN = <span className="text-[#f2c879]">NaN</span>;
const cell = "px-2 py-2";

export default function MergeTabel({ title }: { title: string }) {
  const [how, setHow] = useState<How>("left");
  const [active, setActive] = useState<number | null>(null);
  const pairs = merge(how, JUAL, PRODUK, (j) => j.kode, (p) => p.kode);
  const a = active !== null && active < pairs.length ? pairs[active] : null;
  const src = (side: "l" | "r", i: number) => (a?.[side] === i ? "bg-[#b5d36f] text-[#12140d]" : pairs.some((p) => p[side] === i) ? "bg-zinc-800" : "bg-zinc-800/40 text-zinc-500 line-through");
  const noMatch = pairs.filter((p) => p.l === null || p.r === null).length;

  return (
    <Frame title={title} hint="Pilih jenis penggabungan (how), lalu sentuh atau arahkan kursor ke baris hasil untuk melihat pasangannya di kedua tabel. Baris yang dibuang tampak dicoret.">
      <div role="group" aria-label="Jenis merge" className="flex gap-1 rounded-full bg-zinc-800 p-1">
        {HOWS.map((h) => <button key={h} type="button" aria-pressed={how === h} onClick={() => { setHow(h); setActive(null); }} className={`${simChip} flex-1`}>{h}</button>)}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div>
            <p className="mb-1 font-sans font-bold text-zinc-300">jual (kiri)</p>
            <div className="grid gap-1">{JUAL.map((j, i) => <div key={i} className={`rounded-lg px-2 py-1 transition-colors ${src("l", i)}`}>{j.kode} · {j.jumlah}</div>)}</div>
          </div>
          <div>
            <p className="mb-1 font-sans font-bold text-zinc-300">produk (kanan)</p>
            <div className="grid gap-1">{PRODUK.map((p, i) => <div key={p.kode} className={`rounded-lg px-2 py-1 transition-colors ${src("r", i)}`}>{p.kode} · {p.nama}</div>)}</div>
          </div>
        </div>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0a0c06] p-3 font-mono text-xs text-[#e8efd6]" aria-label="Kode pandas">{`pd.merge(jual, produk, on="kode", how="${how}")`}</pre>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-1 font-mono text-xs">
            <thead><tr className="text-left font-sans text-zinc-400"><th className={cell}>kode</th><th className={cell}>jumlah</th><th className={cell}>nama</th><th className={cell}>kategori</th></tr></thead>
            <tbody>
              {pairs.map((p, k) => {
                const j = p.l === null ? null : JUAL[p.l];
                const r = p.r === null ? null : PRODUK[p.r];
                return (
                  <tr key={`${how}${k}`} tabIndex={0} aria-label={`Baris hasil ${k + 1}`} onMouseEnter={() => setActive(k)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(k)} onBlur={() => setActive(null)} onClick={() => setActive(active === k ? null : k)}
                    className={`sim-pop cursor-pointer outline-offset-2 ${active === k ? "bg-[#b5d36f] text-[#12140d]" : j && r ? "bg-[#b5d36f]/15" : "bg-zinc-800/60"}`}>
                    <td className={`${cell} rounded-l-lg`}>{(j ?? r)!.kode}</td>
                    <td className={cell}>{j ? j.jumlah : NAN}</td>
                    <td className={cell}>{r ? r.nama : NAN}</td>
                    <td className={`${cell} rounded-r-lg`}>{r ? r.kategori : NAN}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p aria-live="polite" className="mt-3 min-h-10 text-sm text-zinc-300">
        {a ? (a.l !== null && a.r !== null ? "Kode cocok di kedua tabel, kolomnya digabung." : "Tidak ada pasangan, kolom dari tabel lain diisi NaN.") : `${pairs.length} baris hasil, ${noMatch} di antaranya tanpa pasangan. Perhatikan K01 muncul dua kali karena ada dua penjualan.`}
      </p>
    </Frame>
  );
}
