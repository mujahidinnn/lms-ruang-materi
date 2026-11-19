import { useState } from "react";
import { command, location, MODES, type Mode, recreate, records, remove, start, type State, verdict, write } from "@/lib/sim/docker-volume";
import Frame, { simButton, simChip, simGhost } from "./Frame";

const Rows = ({ n, alive }: { n: number; alive: boolean }) => (
  <ul className="mt-2 flex min-h-8 flex-wrap gap-1" aria-label="Record di database">
    {n === 0 && <li className="text-[11px] text-zinc-500">{alive ? "belum ada record" : "container tidak ada"}</li>}
    {Array.from({ length: n }, (_, i) => <li key={i} className="sim-pop rounded-md border border-[#b5d36f] bg-[#1d2014] px-1.5 py-0.5 font-mono text-[11px] text-[#b5d36f]">catatan {i + 1}</li>)}
  </ul>
);

export default function DockerVolume({ title }: { title: string }) {
  const [s, setS] = useState<State>(start("none"));
  const pick = (m: Mode) => setS(start(m));
  const v = verdict(s);
  const external = s.mode !== "none";
  const n = records(s);

  return (
    <Frame title={title} hint="Pilih cara menyimpan data, tulis beberapa record, hapus container, lalu buat lagi. Lihat data siapa yang selamat.">
      <div className="flex flex-wrap gap-1 rounded-3xl bg-zinc-800 p-1" role="group" aria-label="Cara menyimpan data">
        {MODES.map((m) => <button key={m.id} type="button" aria-pressed={s.mode === m.id} onClick={() => pick(m.id)} className={`${simChip} grow`}>{m.label}</button>)}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <div className={`rounded-xl border-2 p-3 ${s.alive ? "border-[#b5d36f]" : "border-dashed border-zinc-600"}`}>
          <p className="text-sm font-extrabold">{s.alive ? "Container db (berjalan)" : "Container db (sudah dihapus)"}</p>
          <p className="text-[11px] text-zinc-400">Writable layer{external ? " (kosong, data ditulis ke luar)" : ""}</p>
          {!external && <Rows n={s.layer} alive={s.alive} />}
          {external && <p className="mt-2 min-h-8 text-[11px] text-zinc-500">{s.alive ? "tidak menyimpan apa pun" : "container tidak ada"}</p>}
        </div>

        <div aria-hidden className={`mx-auto h-6 w-0 border-l-2 border-dashed ${external && s.alive ? "border-[#b5d36f]" : "border-zinc-700"}`} />

        <div className={`rounded-xl border-2 p-3 ${external ? "border-[#b5d36f] bg-[#1d2014]" : "border-dashed border-zinc-700"}`}>
          <p className="text-sm font-extrabold">{s.mode === "bind" ? "Folder host" : "Volume pgdata"}</p>
          {external ? <><Rows n={s.store} alive /><p className="break-all font-mono text-[11px] text-zinc-400">{location(s.mode)}</p></> : <p className="mt-1 text-[11px] text-zinc-500">tidak dipakai: tidak ada penyimpanan di luar container</p>}
        </div>

        {!external && <p className="mt-2 break-words font-mono text-[11px] text-zinc-500">data di: {location("none")}</p>}

        <pre className="mt-3 overflow-x-auto rounded-xl bg-black/40 p-3 font-mono text-[11px] leading-5 text-zinc-200 sm:text-xs" aria-label="Perintah docker run"><code>{command(s.mode)}</code></pre>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" disabled={!s.alive} onClick={() => setS(write(s))} className={simButton}>Tulis data</button>
        <button type="button" disabled={!s.alive} onClick={() => setS(remove(s))} className={simGhost}>docker rm -f db</button>
        <button type="button" disabled={s.alive} onClick={() => setS(recreate(s))} className={simButton}>Buat container baru</button>
        <button type="button" onClick={() => pick(s.mode)} className="min-h-11 px-2 text-sm text-zinc-400 underline underline-offset-2">Reset</button>
      </div>

      <p aria-live="polite" className={`mt-3 text-sm font-bold ${v === "hilang" ? "text-red-400" : v === "aman" ? "text-[#7ee081]" : "text-zinc-400"}`}>
        {v === "hilang" ? "Data hilang: writable layer ikut terhapus bersama container."
          : v === "aman" ? `Data aman: ${n > 0 ? `container baru memasang lagi dan melihat ${n} record.` : "ada di luar container; container baru akan memasangnya lagi."}`
          : s.alive ? (n ? `${n} record tersimpan. Sekarang hapus container.` : "Tulis beberapa data dulu.") : "Container sudah dihapus. Buat yang baru."}
      </p>
    </Frame>
  );
}
