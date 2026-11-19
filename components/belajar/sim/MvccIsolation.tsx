import { useState } from "react";
import { type Cmd, type Iso, type Sim, type Who, act, initial } from "../../../lib/sim/mvcc";
import Frame, { simChip } from "./Frame";

const ISO: Iso[] = ["READ COMMITTED", "REPEATABLE READ"];
const CMDS: { c: Cmd; label: string }[] = [
  { c: "BEGIN", label: "BEGIN" }, { c: "UPDATE", label: "UPDATE +10" }, { c: "SELECT", label: "SELECT" },
  { c: "COMMIT", label: "COMMIT" }, { c: "ROLLBACK", label: "ROLLBACK" },
];
const KIND = { ok: "text-[#b5d36f]", err: "text-[#f08a7a]", wait: "text-[#f2c879]" };
const STATE = { active: "berjalan", committed: "commit", aborted: "batal" };

export default function MvccIsolation({ title }: { title: string }) {
  const [iso, setIso] = useState<Iso>("READ COMMITTED");
  const [m, setM] = useState<Sim>(() => initial("READ COMMITTED"));
  const go = (w: Who, c: Cmd) => setM(act(m, w, c));
  const pick = (i: Iso) => { setIso(i); setM(initial(i)); };

  return (
    <Frame title={title} hint="Satu baris rekening, dua sesi. Jalankan perintah bergantian dan lihat apa yang dibaca tiap sesi dan bagaimana versi baris tersimpan.">
      <div role="group" aria-label="Level isolasi" className="flex flex-wrap gap-1 rounded-full bg-zinc-800 p-1">
        {ISO.map((i) => <button key={i} type="button" aria-pressed={iso === i} onClick={() => pick(i)} className={`${simChip} flex-1 px-2 text-xs sm:text-sm`}>{i}</button>)}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {(["A", "B"] as Who[]).map((w) => {
            const s = m.s[w];
            return (
              <section key={w} aria-label={`Sesi ${w}`} className="rounded-xl bg-[#0a0c06] p-2">
                <p className="flex items-center justify-between text-sm font-extrabold">
                  <span>Sesi {w}</span>
                  <span className={`text-xs font-bold ${s.tx !== null ? "text-[#b5d36f]" : "text-zinc-500"}`}>{s.tx !== null ? `txid ${s.tx}` : "tanpa transaksi"}</span>
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {CMDS.map(({ c, label }) => (
                    <button key={c} type="button" aria-label={`${label} di sesi ${w}`} onClick={() => go(w, c)}
                      disabled={(c === "COMMIT" || c === "ROLLBACK" || c === "UPDATE") && s.tx === null || c === "BEGIN" && s.tx !== null}
                      className={`min-h-11 rounded-full border-2 border-noir px-2 font-mono text-xs font-bold disabled:opacity-40 ${c === "SELECT" ? "bg-matcha-300 text-noir" : "bg-zinc-800"}`}>{label}</button>
                  ))}
                </div>
                <div aria-live="polite" className="mt-2 min-h-24 font-mono text-[11px] leading-4">
                  {s.log.length === 0 && <p className="text-zinc-500">Belum ada perintah.</p>}
                  {s.log.slice(-3).map((l, i) => (
                    <p key={s.log.length - 3 + i} className="sim-pop mb-1"><span className="text-zinc-400">{l.sql}</span><br /><span className={KIND[l.kind]}>{l.out}</span></p>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-3 text-xs font-bold text-zinc-300">Versi baris di penyimpanan</p>
        <table className="mt-1 w-full font-mono text-xs">
          <thead><tr className="text-left text-zinc-400"><th className="px-2 py-1">saldo</th><th className="px-2 py-1">xmin</th><th className="px-2 py-1">xmax</th><th className="px-2 py-1">asal</th></tr></thead>
          <tbody>
            {m.versions.map((v, i) => {
              const dead = v.xmax !== null && m.status[v.xmax] === "committed" || m.status[v.xmin] === "aborted";
              return (
                <tr key={i} className={`sim-pop ${dead ? "text-zinc-500 line-through" : "text-zinc-100"} ${m.status[v.xmin] === "active" ? "bg-[#f2c879]/15" : ""}`}>
                  <td className="px-2 py-1.5">{v.saldo}</td><td className="px-2 py-1.5">{v.xmin}</td><td className="px-2 py-1.5">{v.xmax ?? "-"}</td>
                  <td className="px-2 py-1.5 font-sans no-underline">{STATE[m.status[v.xmin]]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-zinc-400">Coret = versi mati. Baris kuning = dibuat transaksi yang belum commit, tak terlihat sesi lain.</p>
      </div>

      <p className="mt-3 text-sm text-zinc-300">
        {iso === "READ COMMITTED" ? "Coba: A BEGIN, A SELECT, B BEGIN, B UPDATE, B COMMIT, A SELECT. Hasil A berubah di tengah transaksi." : "Coba urutan yang sama: A tetap membaca 100 karena snapshot-nya tetap. Lalu A UPDATE akan ditolak."}
      </p>
      <button type="button" onClick={() => setM(initial(iso))} className="mt-1 min-h-11 px-2 text-sm text-zinc-400 underline underline-offset-2">Atur ulang</button>
    </Frame>
  );
}
