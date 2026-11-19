import { useEffect, useState } from "react";
import Frame, { reducedMotion, simButton, simChip, simGhost } from "./Frame";
import { BAD, type Change, GOOD, plan, total } from "../../../lib/sim/docker-layers";

const CHANGES: { id: Change; label: string }[] = [
  { id: "none", label: "Tidak ada yang berubah" },
  { id: "src", label: "Kode sumber berubah" },
  { id: "pkg", label: "package.json berubah" },
];
const fmt = (n: number) => `${String(n).replace(".", ",")} dtk`;

export default function DockerLayers({ title }: { title: string }) {
  const [bad, setBad] = useState(false);
  const [change, setChange] = useState<Change>("src");
  const [p, setP] = useState<number | null>(null);
  const layers = bad ? BAD : GOOD;
  const rows = plan(layers, change);
  const running = p !== null && p < rows.length;
  const done = p !== null && p >= rows.length;

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setP((x) => (x ?? 0) + 1), rows[p!]!.rebuilt ? 700 : 250);
    return () => clearTimeout(t);
  }, [p, running]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (f: () => void) => { f(); setP(null); };
  const build = () => setP(reducedMotion() ? rows.length : 0);
  const mine = total(rows);
  const other = total(plan(bad ? GOOD : BAD, change));

  return (
    <Frame title={title} hint="Pilih apa yang berubah, lalu Build. Satu layer yang berubah membuat semua layer di bawahnya dibangun ulang; sisanya diambil dari cache.">
      <div className="flex flex-wrap gap-1 rounded-3xl bg-zinc-800 p-1" role="group" aria-label="Yang berubah sejak build terakhir">
        {CHANGES.map((c) => <button key={c.id} type="button" aria-pressed={change === c.id} onClick={() => pick(() => setChange(c.id))} className={`${simChip} grow`}>{c.label}</button>)}
      </div>
      <button type="button" aria-pressed={bad} onClick={() => pick(() => setBad(!bad))} className={`${simGhost} mt-2 w-full aria-pressed:border-[#f2c879] aria-pressed:text-[#f2c879] sm:w-auto`}>
        {bad ? "Urutan buruk: COPY . . sebelum npm ci" : "Urutan baik: package.json disalin dulu"}
      </button>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <p className="mb-2 text-xs text-zinc-400">Build sebelumnya sudah tersimpan di cache. Lapisan paling atas adalah dasar image.</p>
        <ol className="flex flex-col gap-1.5" aria-label="Layer Dockerfile">
          {rows.map((r, i) => {
            const state = p === null ? "idle" : i < p ? (r.rebuilt ? "build" : "cache") : i === p ? "now" : "wait";
            const col = state === "build" ? "#f2c879" : state === "cache" ? "#b5d36f" : state === "now" ? "#e8efd6" : "#52525b";
            const real = layers[i]!.sec;
            return (
              <li key={`${bad}${r.cmd}${i}`} className={`rounded-xl border-2 px-3 py-2 transition-colors ${state === "now" ? "animate-pulse" : ""}`} style={{ borderColor: col, background: `${col}${state === "idle" || state === "wait" ? "0d" : "26"}` }}>
                <div className="flex items-center justify-between gap-2">
                  <code className="min-w-0 truncate font-mono text-xs font-bold sm:text-sm" style={{ color: state === "wait" || state === "idle" ? "#d4d4d8" : col }}>{r.cmd}</code>
                  <span className="shrink-0 text-[11px] font-extrabold" style={{ color: col }}>
                    {state === "build" ? "DIBANGUN" : state === "cache" ? "CACHED" : state === "now" ? "memeriksa…" : ""}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                  <span className="min-w-0 grow truncate">{r.note}</span>
                  <span className="shrink-0 font-bold" style={{ color: state === "build" ? col : undefined }}>
                    {state === "build" ? fmt(real) : state === "cache" ? "0 dtk" : `~${fmt(real)} bila dibangun`}
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
                  <div className="h-full rounded-full" style={{ width: `${Math.max(2, (real / 45) * 100)}%`, background: col, opacity: state === "cache" ? 0.35 : 1 }} />
                </div>
              </li>
            );
          })}
        </ol>
        <p role="status" className="mt-3 text-sm font-bold text-[#b5d36f]">
          {done
            ? `Total build: ${fmt(mine)}. ${rows.filter((r) => r.rebuilt).length === 0 ? "Semua layer dari cache." : `${rows.filter((r) => r.rebuilt).length} layer dibangun ulang.`}`
            : running ? "Membangun…" : "Tekan Build untuk melihat layer mana yang dipakai ulang."}
        </p>
        {done && change !== "none" && (
          <p className="mt-1 text-sm text-zinc-300">Dengan urutan {bad ? "baik" : "buruk"} build yang sama makan {fmt(other)}.</p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={simButton} disabled={running} onClick={build}>{done ? "Build lagi" : "Build"}</button>
        <button type="button" className={simGhost} disabled={p === null} onClick={() => setP(null)}>Ulangi</button>
      </div>
    </Frame>
  );
}
