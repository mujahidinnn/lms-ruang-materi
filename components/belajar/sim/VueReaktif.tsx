import { useState } from "react";
import { bacaUlang, basi, buat, buatManual, DEP, KODE, perbarui, ubah, ubahManual, subtotalDari, totalDari, type Hitung, type RefKey, type Refs } from "@/lib/sim/vue-reaktif";
import Frame, { simButton, simGhost } from "./Frame";
import Chips, { range, snippet } from "./Chips";

const MODE = ["Reaktif (Vue)", "Manual (tanpa reaktivitas)"] as const;
const AWAL: Refs = { harga: 25000, jumlah: 2, diskon: 10 };
const SLIDER: { k: RefKey; label: string; min: number; max: number; step: number }[] = [
  { k: "harga", label: "harga", min: 5000, max: 50000, step: 5000 },
  { k: "jumlah", label: "jumlah", min: 1, max: 10, step: 1 },
  { k: "diskon", label: "diskon (%)", min: 0, max: 50, step: 5 },
];
const rp = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
const LABEL = "text-[10px] fill-[#bfc0b5] font-mono";
const POS: Record<RefKey | Hitung | "tampilan", [number, number]> = { harga: [70, 40], jumlah: [70, 110], diskon: [70, 180], subtotal: [240, 75], total: [240, 150], tampilan: [410, 112] };

export default function VueReaktif({ title }: { title: string }) {
  const [mode, setMode] = useState<(typeof MODE)[number]>(MODE[0]);
  const [s, setS] = useState(() => buat(AWAL));
  const [m, setM] = useState(() => buatManual(AWAL));
  const [terakhir, setTerakhir] = useState<RefKey | null>(null);
  const manual = mode === MODE[1];
  const refs = manual ? m.refs : s.refs;

  const ganti = (v: string) => {
    if (v === MODE[1]) setM(buatManual(s.refs)); else setS(buat(m.refs));
    setTerakhir(null); setMode(v as (typeof MODE)[number]);
  };
  const set = (k: RefKey, v: number) => { setTerakhir(k); manual ? setM((o) => ubahManual(o, k, v)) : setS((o) => ubah(o, k, v)); };
  const nilaiRef = (k: RefKey) => (k === "harga" ? rp(refs.harga) : k === "diskon" ? `${refs.diskon}%` : String(refs.jumlah));
  const edges: [keyof typeof POS, keyof typeof POS][] = [["harga", "subtotal"], ["jumlah", "subtotal"], ["subtotal", "total"], ["diskon", "total"], ["subtotal", "tampilan"], ["total", "tampilan"]];
  const aktif = (a: string, b: string) => (a === terakhir && s.ulang.includes(b as Hitung)) || (s.ulang.includes(a as Hitung) && (b === "tampilan" || s.ulang.includes(b as Hitung)));
  const ulangTeks = s.ulang.length ? `Dihitung ulang: ${s.ulang.join(" dan ")}.` : "Tidak ada yang dihitung ulang.";
  const cacheTeks = s.dariCache.length ? ` Dari cache: ${s.dariCache.join(" dan ")}.` : "";
  const ringkas = terakhir === null && s.render === 1 ? "Ubah salah satu nilai di bawah. Tampilan ikut berubah otomatis." : `${terakhir ? `Kamu mengubah ${terakhir}. ` : "Dibaca ulang tanpa perubahan. "}${ulangTeks}${cacheTeks} Template di-render ${s.render}x.`;
  const bas = basi(m);

  return (
    <Frame title={title} hint="Ubah ref dan lihat siapa yang ikut terhitung ulang. Computed hanya bekerja bila yang dibacanya berubah, selebihnya memakai cache.">
      <Chips label="Cara memperbarui tampilan" value={mode} options={MODE} onChange={ganti} />
      <div className="sim-stage mt-3 p-3">
        {!manual ? (
          <>
            <svg viewBox="0 0 480 220" role="img" aria-label={`Grafik dependensi: harga dan jumlah ke subtotal, subtotal dan diskon ke total, subtotal dan total ke tampilan. ${ringkas}`} className="mx-auto block w-full max-w-xl">
              {edges.map(([a, b]) => {
                const on = aktif(a, b);
                return <path key={a + b} d={`M${POS[a][0] + 40} ${POS[a][1]}L${POS[b][0] - 40} ${POS[b][1]}`} stroke={on ? "#ffd84d" : "#3a3d30"} strokeWidth={on ? 3 : 2} />;
              })}
              {(["harga", "jumlah", "diskon"] as const).map((k) => (
                <g key={k}>
                  <rect x={POS[k][0] - 40} y={POS[k][1] - 20} width="80" height="40" rx="8" fill={k === terakhir ? "#ffd84d" : "#d6ea9c"} stroke="#12140d" strokeWidth="2" />
                  <text x={POS[k][0]} y={POS[k][1] - 3} textAnchor="middle" className="fill-[#12140d] text-[11px] font-bold">ref {k}</text>
                  <text x={POS[k][0]} y={POS[k][1] + 12} textAnchor="middle" className="fill-[#12140d] text-[11px] font-mono">{nilaiRef(k)}</text>
                </g>
              ))}
              {(["subtotal", "total"] as const).map((k) => {
                const hit = s.ulang.includes(k);
                return (
                  <g key={k}>
                    <rect x={POS[k][0] - 52} y={POS[k][1] - 26} width="104" height="52" rx="8" fill={hit ? "#ffd84d" : "#7fb3d9"} stroke="#12140d" strokeWidth="2" />
                    <text x={POS[k][0]} y={POS[k][1] - 10} textAnchor="middle" className="fill-[#12140d] text-[10px] font-bold">computed {k}</text>
                    <text x={POS[k][0]} y={POS[k][1] + 4} textAnchor="middle" className="fill-[#12140d] text-[11px] font-mono">{rp(s[k].nilai)}</text>
                    <text x={POS[k][0]} y={POS[k][1] + 18} textAnchor="middle" className="fill-[#12140d] text-[9px]">hitung {s[k].hitung}x · cache {s[k].cache}x</text>
                  </g>
                );
              })}
              <rect x={POS.tampilan[0] - 50} y={POS.tampilan[1] - 36} width="100" height="72" rx="8" fill="#f4f7ea" stroke="#12140d" strokeWidth="2" />
              <text x={POS.tampilan[0]} y={POS.tampilan[1] - 16} textAnchor="middle" className="fill-[#12140d] text-[11px] font-bold">tampilan</text>
              <text x={POS.tampilan[0]} y={POS.tampilan[1]} textAnchor="middle" className="fill-[#12140d] text-[10px] font-mono">{rp(s.subtotal.nilai)}</text>
              <text x={POS.tampilan[0]} y={POS.tampilan[1] + 14} textAnchor="middle" className="fill-[#12140d] text-[10px] font-mono font-bold">{rp(s.total.nilai)}</text>
              <text x={POS.tampilan[0]} y={POS.tampilan[1] + 28} textAnchor="middle" className="fill-[#12140d] text-[9px]">render {s.render}x</text>
              <text x="8" y="14" className={LABEL}>kuning: baru dihitung ulang</text>
            </svg>
            <p aria-live="polite" className="mt-2 min-h-12 text-center text-sm text-zinc-300">{ringkas}</p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              {(["subtotal", "total"] as const).map((k) => (
                <div key={k} className="rounded-xl border-2 border-zinc-700 p-2">
                  <p className="text-xs text-zinc-400">layar: {k}</p>
                  <p className={`font-mono font-bold ${bas.includes(k) ? "text-[#f08a7a]" : "text-matcha-300"}`}>{rp(m.tampil[k])}</p>
                  <p className="text-xs text-zinc-400">seharusnya {rp(k === "subtotal" ? subtotalDari(m.refs) : totalDari(m.refs))}</p>
                  {bas.includes(k) && <p className="text-xs font-bold text-[#f08a7a]">basi</p>}
                </div>
              ))}
            </div>
            <p aria-live="polite" className="mt-2 min-h-12 text-center text-sm text-zinc-300">
              {bas.length ? `Layar masih menampilkan angka lama (${bas.join(", ")}). Kamu harus memanggil update sendiri.` : "Layar cocok dengan data."} Pembaruan manual: {m.panggilan}x.
            </p>
          </>
        )}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {SLIDER.map((x) => (
          <label key={x.k} className="grid gap-1 text-sm font-bold">
            <span>{x.label}: <span className="font-mono">{nilaiRef(x.k)}</span></span>
            <input type="range" className={range} min={x.min} max={x.max} step={x.step} value={refs[x.k]} onChange={(e) => set(x.k, Number(e.target.value))} />
          </label>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {manual
          ? <button type="button" onClick={() => setM(perbarui)} className={simButton}>Perbarui DOM (updateSubtotal, updateTotal)</button>
          : <button type="button" onClick={() => { setTerakhir(null); setS(bacaUlang); }} className={simGhost}>Baca ulang tanpa mengubah</button>}
        <button type="button" onClick={() => { setTerakhir(null); setS(buat(AWAL)); setM(buatManual(AWAL)); }} className={simGhost}>Reset</button>
      </div>
      <pre className={snippet} aria-label="Kode Vue">{manual ? `// tanpa reaktivitas: tiap perubahan harus diikuti\nsubtotalEl.textContent = harga * jumlah\ntotalEl.textContent = harga * jumlah * (100 - diskon) / 100` : KODE}</pre>
    </Frame>
  );
}
