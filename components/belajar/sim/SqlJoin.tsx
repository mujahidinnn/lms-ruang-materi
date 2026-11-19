import { useState } from "react";
import { type JoinType, join } from "../../../lib/sim/sql-join";
import Frame, { G, simChip } from "./Frame";

const PELANGGAN = [{ id: 1, nama: "Ani" }, { id: 2, nama: "Budi" }, { id: 3, nama: "Citra" }, { id: 4, nama: "Dedi" }];
const PESANAN = [
  { id: 101, pelanggan_id: 1 as number | null, total: 50 },
  { id: 102, pelanggan_id: 1 as number | null, total: 20 },
  { id: 103, pelanggan_id: 2 as number | null, total: 75 },
  { id: 104, pelanggan_id: null as number | null, total: 30 },
];
const TYPES: JoinType[] = ["INNER", "LEFT", "RIGHT", "FULL"];
const NULL = <span className="text-[#f2c879]">NULL</span>;
const rowBase = "rounded-lg px-2 py-1 transition-colors";

function Venn({ type }: { type: JoinType }) {
  const l = type === "LEFT" || type === "FULL";
  const r = type === "RIGHT" || type === "FULL";
  return (
    <svg viewBox="0 0 160 90" role="img" aria-label={`Diagram Venn ${type} JOIN`} className="mx-auto h-24 w-auto">
      <defs><clipPath id="vennL"><circle cx="62" cy="45" r="34" /></clipPath></defs>
      <circle cx="62" cy="45" r="34" fill={G} opacity={l ? 0.6 : 0} />
      <circle cx="98" cy="45" r="34" fill={G} opacity={r ? 0.6 : 0} />
      <circle cx="98" cy="45" r="34" fill={G} clipPath="url(#vennL)" opacity={type === "INNER" ? 0.75 : 0} />
      <circle cx="62" cy="45" r="34" fill="none" stroke="#e8efd6" strokeWidth="2" />
      <circle cx="98" cy="45" r="34" fill="none" stroke="#e8efd6" strokeWidth="2" strokeDasharray="5 3" />
      <text x="40" y="49" fontSize="10" fill="#e8efd6" textAnchor="middle" fontWeight="700">pelanggan</text>
      <text x="120" y="49" fontSize="10" fill="#e8efd6" textAnchor="middle" fontWeight="700">pesanan</text>
    </svg>
  );
}

export default function SqlJoin({ title }: { title: string }) {
  const [type, setType] = useState<JoinType>("INNER");
  const [active, setActive] = useState<number | null>(null);
  const pairs = join(type, PELANGGAN, PESANAN, (c) => c.id, (o) => o.pelanggan_id);
  const a = active !== null && active < pairs.length ? pairs[active] : null;
  const used = (side: "l" | "r", i: number) => pairs.some((p) => p[side] === i);
  const sql = `SELECT p.nama, o.id, o.total\nFROM pelanggan p\n${type} JOIN pesanan o\n  ON o.pelanggan_id = p.id;`;

  const hl = (side: "l" | "r", i: number) => (a?.[side] === i ? "bg-[#b5d36f] text-[#12140d]" : used(side, i) ? "bg-zinc-800" : "bg-zinc-800/40 text-zinc-500");

  return (
    <Frame title={title} hint="Pilih jenis JOIN, lalu sentuh atau arahkan kursor ke baris hasil untuk melihat pasangannya di tabel asal.">
      <div role="group" aria-label="Jenis JOIN" className="flex flex-wrap gap-1 rounded-full bg-zinc-800 p-1">
        {TYPES.map((t) => <button key={t} type="button" aria-pressed={type === t} onClick={() => { setType(t); setActive(null); }} className={`${simChip} flex-1`}>{t}</button>)}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div>
            <p className="mb-1 font-sans font-bold text-zinc-300">pelanggan</p>
            <div className="grid gap-1">
              {PELANGGAN.map((c, i) => <div key={c.id} className={`${rowBase} ${hl("l", i)}`}>{c.id} {c.nama}</div>)}
            </div>
          </div>
          <div>
            <p className="mb-1 font-sans font-bold text-zinc-300">pesanan</p>
            <div className="grid gap-1">
              {PESANAN.map((o, i) => <div key={o.id} className={`${rowBase} ${hl("r", i)}`}>{o.id} · pel={o.pelanggan_id ?? NULL} · {o.total}</div>)}
            </div>
          </div>
        </div>
        <Venn type={type} />
        <pre className="overflow-x-auto rounded-xl bg-[#0a0c06] p-3 font-mono text-xs leading-5 text-[#e8efd6]" aria-label="Query SQL">{sql}</pre>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full font-mono text-xs">
            <thead><tr className="text-left font-sans text-zinc-400"><th className="px-2 py-1">nama</th><th className="px-2 py-1">o.id</th><th className="px-2 py-1">total</th></tr></thead>
            <tbody>
              {pairs.map((p, k) => {
                const c = p.l === null ? null : PELANGGAN[p.l];
                const o = p.r === null ? null : PESANAN[p.r];
                const matched = c && o;
                return (
                  <tr key={`${type}${k}`} tabIndex={0} aria-label={`Baris hasil ${k + 1}`} onMouseEnter={() => setActive(k)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(k)} onBlur={() => setActive(null)} onClick={() => setActive(active === k ? null : k)}
                    className={`sim-pop min-h-11 cursor-pointer outline-offset-2 ${active === k ? "bg-[#b5d36f] text-[#12140d]" : matched ? "bg-[#b5d36f]/15" : "bg-zinc-800/60"}`}>
                    <td className="rounded-l-lg px-2 py-2">{c ? c.nama : NULL}</td>
                    <td className="px-2 py-2">{o ? o.id : NULL}</td>
                    <td className="rounded-r-lg px-2 py-2">{o ? o.total : NULL}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p aria-live="polite" className="mt-3 min-h-10 text-sm text-zinc-300">
        {a ? (a.l !== null && a.r !== null ? "Baris cocok: kedua tabel punya pasangan." : "Tidak ada pasangan, sisi lainnya diisi NULL.") : `${pairs.length} baris hasil. Baris hijau terang punya pasangan di kedua tabel.`}
      </p>
    </Frame>
  );
}
