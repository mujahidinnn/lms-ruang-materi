import { useState } from "react";
import { type Db, type Mode, type Result, deleteKelas, insertSiswa } from "../../../lib/sim/fk";
import Frame, { G, simButton, simChip, simGhost } from "./Frame";

const START: Db = {
  kelas: [{ id: 1, nama: "X RPL" }, { id: 2, nama: "X TKJ" }, { id: 3, nama: "XI RPL" }],
  siswa: [
    { id: 101, nama: "Ani", kelas_id: 1 }, { id: 102, nama: "Budi", kelas_id: 1 },
    { id: 103, nama: "Citra", kelas_id: 2 }, { id: 104, nama: "Dedi", kelas_id: 3 },
  ],
};
const NAMES = ["Eka", "Fitri", "Gilang", "Hana", "Indra", "Jihan"];
// Fixed geometry so connector lines need no DOM measuring: header 32px, rows 44px + 4px gap.
const Y = (i: number) => 32 + i * 48 + 22;
type Sel = { t: "k" | "s"; id: number } | null;

export default function FkRelation({ title }: { title: string }) {
  const [db, setDb] = useState(START);
  const [mode, setMode] = useState<Mode>("RESTRICT");
  const [sel, setSel] = useState<Sel>({ t: "k", id: 1 });
  const [hover, setHover] = useState<Sel>(null);
  const [msg, setMsg] = useState<Result | null>(null);
  const [n, setN] = useState(0);

  const f = hover ?? sel;
  const kelasOf = (s: Sel) => (s?.t === "k" ? s.id : s ? db.siswa.find((x) => x.id === s.id)?.kelas_id : undefined);
  const hotK = kelasOf(f);
  const siswaHot = (s: { id: number; kelas_id: number }) => (f?.t === "s" ? s.id === f.id : s.kelas_id === hotK);
  const rows = Math.max(db.kelas.length, db.siswa.length);
  const h = 32 + rows * 48;
  const selK = sel ? db.kelas.find((k) => k.id === kelasOf(sel)) : undefined;

  const run = (r: Result) => { setDb(r.db); setMsg(r); if (sel && !r.db.kelas.some((k) => k.id === kelasOf(sel))) setSel(null); };
  const row = (hot: boolean) => `sim-pop flex h-11 w-full items-center gap-2 rounded-lg px-2 text-left font-mono text-xs transition-colors ${hot ? "bg-[#b5d36f] text-[#12140d]" : "bg-zinc-800 text-zinc-200"}`;

  return (
    <Frame title={title} hint="Sentuh baris untuk melihat baris yang terhubung lewat foreign key. Lalu coba hapus parent atau tambah anak tanpa parent.">
      <div className="sim-stage p-3 sm:p-4">
        <div className="grid grid-cols-[1fr_2.5rem_1.25fr] sm:grid-cols-[1fr_4rem_1.25fr]" onMouseLeave={() => setHover(null)}>
          <div>
            <p className="mb-1 flex h-7 items-center font-sans text-xs font-bold text-zinc-300">kelas</p>
            <div className="grid gap-1">
              {db.kelas.map((k) => (
                <button key={k.id} type="button" aria-pressed={sel?.t === "k" && sel.id === k.id} onClick={() => setSel({ t: "k", id: k.id })} onMouseEnter={() => setHover({ t: "k", id: k.id })} onFocus={() => setHover({ t: "k", id: k.id })} onBlur={() => setHover(null)} className={row(hotK === k.id)}>
                  <b>{k.id}</b><span className="truncate">{k.nama}</span>
                </button>
              ))}
            </div>
          </div>
          <svg width="100%" height={h} viewBox={`0 0 40 ${h}`} preserveAspectRatio="none" aria-hidden>
            {db.siswa.map((s, si) => {
              const ki = db.kelas.findIndex((k) => k.id === s.kelas_id);
              if (ki < 0) return null;
              const on = siswaHot(s);
              return <path key={s.id} d={`M0 ${Y(ki)}C20 ${Y(ki)} 20 ${Y(si)} 40 ${Y(si)}`} vectorEffect="non-scaling-stroke" fill="none" stroke={on ? G : "#4a5233"} strokeWidth={on ? 3 : 1.5} className={on ? "sim-flow" : ""} strokeDasharray={on ? "6 3" : undefined} />;
            })}
          </svg>
          <div>
            <p className="mb-1 flex h-7 items-center font-sans text-xs font-bold text-zinc-300">siswa <span className="ml-2 font-normal text-zinc-500">kelas_id = FK</span></p>
            <div className="grid gap-1">
              {db.siswa.map((s) => (
                <button key={s.id} type="button" aria-pressed={sel?.t === "s" && sel.id === s.id} onClick={() => setSel({ t: "s", id: s.id })} onMouseEnter={() => setHover({ t: "s", id: s.id })} onFocus={() => setHover({ t: "s", id: s.id })} onBlur={() => setHover(null)} className={row(siswaHot(s))}>
                  <b>{s.id}</b><span className="truncate">{s.nama}</span><span className="ml-auto text-[#f2c879]">{s.kelas_id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        {db.siswa.length === 0 && <p className="mt-2 text-xs text-zinc-400">Tabel siswa kosong.</p>}
        <pre aria-live="polite" className={`mt-3 min-h-16 whitespace-pre-wrap rounded-xl bg-[#0a0c06] p-3 font-mono text-xs leading-5 ${msg?.error ? "text-[#f08a7a]" : "text-[#b5d36f]"}`}>{msg ? (msg.error ?? msg.ok) : `FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE ${mode}`}</pre>
      </div>

      <div role="group" aria-label="Aturan ON DELETE" className="mt-3 flex gap-1 rounded-full bg-zinc-800 p-1">
        {(["RESTRICT", "CASCADE"] as Mode[]).map((m) => <button key={m} type="button" aria-pressed={mode === m} onClick={() => { setMode(m); setMsg(null); }} className={`${simChip} flex-1`}>{m}</button>)}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={!selK} onClick={() => selK && run(deleteKelas(db, selK.id, mode))} className={simButton}>Hapus kelas {selK ? selK.nama : "terpilih"}</button>
        <button type="button" onClick={() => run(insertSiswa(db, "Tanpa Kelas", 9))} className={simGhost}>Tambah siswa ke kelas 9</button>
        <button type="button" disabled={!selK} onClick={() => { if (selK) { run(insertSiswa(db, NAMES[n % NAMES.length], selK.id)); setN(n + 1); } }} className={simGhost}>Tambah siswa ke kelas terpilih</button>
        <button type="button" onClick={() => { setDb(START); setMsg(null); setSel({ t: "k", id: 1 }); setN(0); }} className="min-h-11 px-2 text-sm text-zinc-400 underline underline-offset-2">Atur ulang</button>
      </div>
    </Frame>
  );
}
