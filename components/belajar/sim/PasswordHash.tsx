import { useEffect, useState } from "react";
import Frame, { simButton, simChip, simGhost } from "./Frame";
import { DICT, ITERS, buildTable, crack, randomSalt, store, toHex, type Mode } from "../../../lib/sim/password-hash";

const MODES: { id: Mode; label: string }[] = [
  { id: "plain", label: "Teks polos" },
  { id: "sha", label: "SHA-256 biasa" },
  { id: "pbkdf2", label: "Salt + PBKDF2" },
];
const short = (s: string) => (s.length > 24 ? `${s.slice(0, 12)}…${s.slice(-6)}` : s);

type Row = { stored: string; cracked: string | null };

export default function PasswordHash({ title }: { title: string }) {
  const [pw, setPw] = useState("rahasia123");
  const [mode, setMode] = useState<Mode>("plain");
  const [ii, setIi] = useState(1);
  const [salts, setSalts] = useState(() => [randomSalt(), randomSalt()]);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [ms, setMs] = useState<number | null>(null);
  const iters = ITERS[ii];
  const saltHex = salts.map((s) => toHex(s));

  useEffect(() => {
    let dead = false;
    const t = setTimeout(async () => {
      const table = await buildTable();
      const out: Row[] = [];
      let took = 0;
      for (const salt of salts) {
        const t0 = performance.now();
        const stored = await store(mode, pw, salt, iters);
        took = performance.now() - t0;
        out.push({ stored, cracked: crack(mode, stored, table) });
      }
      if (dead) return;
      setRows(out);
      setMs(took);
    }, 250);
    return () => { dead = true; clearTimeout(t); };
  }, [pw, mode, iters, salts]);

  const same = rows && rows[0].stored === rows[1].stored;
  const guessMs = (ms ?? 0) * DICT.length;

  return (
    <Frame title={title} hint="Ketik password, pilih cara menyimpannya, lalu lihat apa yang didapat penyerang dari database yang bocor.">
      <label className="block text-sm font-bold" htmlFor="ph-pw">Password pengguna</label>
      <input id="ph-pw" value={pw} onChange={(e) => setPw(e.target.value)} maxLength={40} autoComplete="off" spellCheck={false} className="mt-1 min-h-11 w-full rounded-xl border-2 border-noir bg-zinc-800 px-3 font-mono text-sm" />

      <div className="mt-3 flex flex-wrap gap-1 rounded-3xl bg-zinc-800 p-1" role="group" aria-label="Cara menyimpan">
        {MODES.map((m) => <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)} className={`${simChip} grow`}>{m.label}</button>)}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        {mode === "pbkdf2" && (
          <div className="mb-3 rounded-xl bg-black/40 p-3">
            <label htmlFor="ph-it" className="text-xs font-bold text-zinc-300">Iterasi: <span className="font-mono text-[#b5d36f]">{iters.toLocaleString("id-ID")}</span></label>
            <input id="ph-it" type="range" min={0} max={ITERS.length - 1} step={1} value={ii} onChange={(e) => setIi(Number(e.target.value))} className="mt-1 block min-h-11 w-full accent-[#b5d36f]" aria-valuetext={`${iters} iterasi`} />
            <div className="flex justify-between font-mono text-[11px] text-zinc-400"><span>1k</span><span>10k</span><span>100k</span><span>600k</span></div>
          </div>
        )}

        <p className="text-xs font-bold text-zinc-300">Isi database (dua pengguna, password sama)</p>
        <div className="mt-2 flex flex-col gap-2">
          {["Ani", "Budi"].map((u, i) => (
            <div key={u} className="rounded-xl bg-black/40 px-3 py-2">
              <p className="text-xs font-bold text-zinc-400">{u}</p>
              {mode === "pbkdf2" && <p className="font-mono text-[11px] break-all text-[#f2c879]">salt: {saltHex[i]}</p>}
              <p className="sim-pop font-mono text-xs font-bold break-all text-[#e8efd6]" key={rows?.[i]?.stored}>{rows ? (mode === "plain" ? rows[i].stored : short(rows[i].stored)) : "…"}</p>
            </div>
          ))}
        </div>
        <p role="status" className="mt-2 text-sm font-bold" style={{ color: same ? "#ff8a7a" : "#b5d36f" }}>
          {rows ? (mode === "plain" ? "Password terbaca langsung." : same ? "Hash Ani dan Budi identik: ketahuan mereka memakai password sama." : "Hash Ani dan Budi berbeda walau password sama.") : "Menghitung…"}
        </p>
        {mode === "pbkdf2" && ms !== null && <p className="text-xs text-zinc-300">Waktu satu hash: <span className="font-mono font-bold text-[#b5d36f]">{ms.toFixed(1)} ms</span></p>}

        <div className="mt-3 rounded-xl border-2 border-dashed border-[#ff8a7a] p-3">
          <p className="text-sm font-bold text-[#ff8a7a]">Bocor dan diserang</p>
          <p className="mt-1 text-xs text-zinc-300">Kamus penyerang: <span className="font-mono">{DICT.join(", ")}</span></p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {["Ani", "Budi"].map((u, i) => {
              const c = rows?.[i]?.cracked;
              return (
                <li key={u} className="rounded-lg bg-black/40 px-3 py-2">
                  <span className="font-bold">{u}: </span>
                  {!rows ? "…" : c ? <span className="font-bold text-[#ff8a7a]">terbongkar, password = <span className="font-mono">{c}</span></span> : <span className="font-bold text-[#b5d36f]">tidak cocok dengan tabel</span>}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-zinc-300">
            {mode === "plain" && "Tidak ada yang perlu dibongkar: semua password sudah terbaca."}
            {mode === "sha" && "Tabel hash dibuat sekali, lalu dipakai untuk semua akun. Password di luar kamus butuh brute force, tapi SHA-256 cepat sehingga murah."}
            {mode === "pbkdf2" && `Tabel siap pakai tidak berguna. Penyerang harus menebak per pengguna: ${DICT.length} tebakan x ${(ms ?? 0).toFixed(1)} ms = ${guessMs.toFixed(0)} ms per akun, dan membesar mengikuti iterasi.`}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={simButton} onClick={() => setSalts([randomSalt(), randomSalt()])} disabled={mode !== "pbkdf2"}>Acak salt baru</button>
        <button type="button" className={simGhost} onClick={() => { setPw("rahasia123"); setMode("plain"); setIi(1); }}>Ulangi</button>
      </div>
    </Frame>
  );
}
