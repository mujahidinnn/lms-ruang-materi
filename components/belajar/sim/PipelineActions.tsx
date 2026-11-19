import { useEffect, useState } from "react";
import { buildJobs, levels, outcomes, STEPS, totalTicks, view, yaml, type Phase } from "@/lib/sim/pipeline-actions";
import Frame, { reducedMotion, simButton, simChip, simGhost } from "./Frame";

const TONE: Record<Phase, string> = {
  menunggu: "border-zinc-700 text-zinc-500",
  jalan: "border-[#b5d36f] text-zinc-100",
  lulus: "border-[#7ee081] text-zinc-100",
  gagal: "border-red-400 text-zinc-100",
  dilewati: "border-zinc-600 border-dashed text-zinc-500",
};
const BADGE: Record<Phase, string> = { menunggu: "menunggu", jalan: "berjalan", lulus: "lulus", gagal: "gagal", dilewati: "dilewati" };
const STEP_NAMES = ["checkout", "npm ci"];

export default function PipelineActions({ title }: { title: string }) {
  const [matrix, setMatrix] = useState(false);
  const [needs, setNeeds] = useState(true);
  const [fail, setFail] = useState<string | null>(null);
  const [t, setT] = useState(-1);
  const [running, setRunning] = useState(false);

  const jobs = buildJobs(matrix, needs);
  const failId = jobs.some((j) => j.id === fail) ? fail : null;
  const total = totalTicks(jobs);
  const lv = levels(jobs);
  const res = outcomes(jobs, failId);
  const v = view(jobs, failId, t);
  const cols = Math.max(...Object.values(lv)) + 1;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setT((x) => {
      if (x + 1 >= total) { setRunning(false); return total; }
      return x + 1;
    }), 450);
    return () => clearInterval(id);
  }, [running, total]);

  const change = (f: () => void) => { f(); setRunning(false); setT(-1); };
  const run = () => {
    if (reducedMotion()) { setT(total); return; }
    setT(0); setRunning(true);
  };
  const done = t >= total;
  const nFail = Object.values(res).filter((o) => o === "gagal").length;
  const nSkip = Object.values(res).filter((o) => o === "dilewati").length;
  const skipped = new Set(jobs.filter((j) => res[j.id] === "dilewati").map((j) => j.group));

  return (
    <Frame title={title} hint="Tekan Jalankan untuk melihat job berjalan sesuai needs. Gagalkan satu job dan lihat siapa yang ikut dilewati.">
      <div className="sim-stage p-2 sm:p-4">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} aria-label="Graf job">
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className="flex min-w-0 flex-col justify-center gap-1.5">
              {jobs.filter((j) => lv[j.id] === c).map((j) => {
                const s = v[j.id]!;
                return (
                  <div key={j.id} className={`min-w-0 rounded-xl border-2 bg-[#1d2014] p-2 ${TONE[s.phase]} ${s.phase === "jalan" ? "shadow-[0_0_14px_#b5d36f55]" : ""}`}>
                    <p className="truncate text-xs font-extrabold sm:text-sm">{j.title}</p>
                    <p className="truncate font-mono text-[10px] text-zinc-400">{j.needs.length ? `needs: ${j.needs.join(", ")}` : "tanpa needs"}</p>
                    <ul className="mt-1.5 space-y-0.5 font-mono text-[10px] sm:text-xs" aria-label={`Step ${j.title}`}>
                      {[...STEP_NAMES, j.cmd].map((n, i) => {
                        const state = s.phase === "dilewati" ? "skip" : i < s.step ? (s.phase === "gagal" && i === STEPS - 1 ? "fail" : "ok") : i === s.step && s.phase === "jalan" ? "now" : "wait";
                        return (
                          <li key={n} className={`truncate ${state === "ok" ? "text-[#7ee081]" : state === "fail" ? "text-red-400" : state === "now" ? "text-[#b5d36f]" : "text-zinc-600"}`}>
                            {state === "ok" ? "✓" : state === "fail" ? "✗" : state === "now" ? "›" : state === "skip" ? "-" : "·"} {n}
                          </li>
                        );
                      })}
                    </ul>
                    <p className={`mt-1 text-[11px] font-bold ${s.phase === "gagal" ? "text-red-400" : s.phase === "lulus" ? "text-[#7ee081]" : ""}`}>{BADGE[s.phase]}</p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-black/50 px-3 py-2 font-mono text-[11px] leading-5 text-zinc-300 sm:text-xs" aria-label="Cuplikan YAML">
          {yaml(jobs, matrix).map((r, i) => (
            <span key={i} className={r.job && skipped.has(r.job) && done ? "block bg-amber-400/15 text-amber-300" : r.text.includes("needs") ? "block text-[#b5d36f]" : "block"}>{r.text}</span>
          ))}
        </pre>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={run} disabled={running} className={simButton}>{done ? "Jalankan ulang" : "Jalankan workflow"}</button>
        <button type="button" aria-pressed={needs} onClick={() => change(() => setNeeds((n) => !n))} className={`${simGhost} aria-pressed:bg-noir aria-pressed:text-on-noir`}>needs: {needs ? "aktif" : "dimatikan"}</button>
        <button type="button" aria-pressed={matrix} onClick={() => change(() => setMatrix((m) => !m))} className={`${simGhost} aria-pressed:bg-noir aria-pressed:text-on-noir`}>Matrix 3 versi Node</button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1" role="group" aria-label="Gagalkan job">
        <span className="px-2 text-sm text-zinc-400">gagalkan job:</span>
        <button type="button" aria-pressed={failId === null} onClick={() => change(() => setFail(null))} className={simChip}>tidak ada</button>
        {jobs.map((j) => <button key={j.id} type="button" aria-pressed={failId === j.id} onClick={() => change(() => setFail(j.id))} className={simChip}>{j.id}</button>)}
      </div>
      <p aria-live="polite" className="mt-3 text-sm text-zinc-400">
        {!done ? (running ? "Job berjalan; job di kolom berikutnya menunggu yang di kiri selesai." : "Job tanpa needs berjalan bersamaan; job dengan needs menunggu.")
          : nFail ? `${nFail} job gagal, ${nSkip} job dilewati.${nSkip ? " Job yang needs-nya tidak lulus tidak pernah dimulai." : needs ? "" : " Tanpa needs, job lain tetap jalan walau ada yang gagal, termasuk deploy."}`
          : "Semua job lulus. Waktu total mengikuti jalur terpanjang, bukan jumlah semua job."}
      </p>
    </Frame>
  );
}
