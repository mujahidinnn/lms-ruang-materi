import { useEffect, useState } from "react";
import { agile, FEATURES, featuresAt, progress, waterfall, type Plan } from "@/lib/sim/sdlc-waterfall-agile";
import Frame, { reducedMotion, simButton, simGhost } from "./Frame";

function Lane({ name, plan, t, scale, accent }: { name: string; plan: Plan; t: number; scale: number; accent: string }) {
  const n = featuresAt(plan, t);
  const now = plan.segs.find((s) => t > s.start && t <= s.start + s.len);
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-sm font-extrabold">{name}</p>
        <div className="flex gap-1" role="img" aria-label={`${n} dari ${FEATURES} fitur sudah berfungsi`}>
          {Array.from({ length: FEATURES }, (_, i) => (
            <span key={i} className={`size-3.5 rounded border-2 ${i < n ? "border-[#b5d36f] bg-[#b5d36f]" : "border-zinc-600"}`} />
          ))}
        </div>
      </div>
      <div className="relative h-12 overflow-hidden rounded-lg bg-black/40" aria-label={`Lini masa ${name}`}>
        {plan.segs.map((s) => {
          const rework = s.kind === "ulang";
          const p = progress(s, t);
          return (
            <div key={s.id} title={`${s.label}: ${s.len} minggu`} className={`absolute inset-y-1 overflow-hidden rounded-lg border ${rework ? "border-red-400 bg-red-400/15" : "border-zinc-600 bg-zinc-800"}`}
              style={{ left: `calc(${(s.start / scale) * 100}% + 1px)`, width: `calc(${(s.len / scale) * 100}% - 2px)` }}>
              <div className="absolute inset-y-0 left-0" style={{ width: `${p * 100}%`, background: rework ? "#f8717166" : accent + "aa" }} />
              <span className="relative block truncate px-1 text-[9px] font-bold leading-[2.5rem] sm:text-[11px]">{s.label}</span>
            </div>
          );
        })}
        {plan.changeAt !== null && (
          <div className="absolute inset-y-0 border-l-2 border-dashed border-amber-300" style={{ left: `${(plan.changeAt / scale) * 100}%` }} aria-hidden>
            <span className="absolute left-1 top-0 text-[9px] font-bold text-amber-300">ubah</span>
          </div>
        )}
        <div className="absolute inset-y-0 w-0.5 bg-white/80" style={{ left: `${(Math.min(t, plan.total) / scale) * 100}%` }} aria-hidden />
      </div>
      <p className="mt-1.5 min-h-5 text-xs text-zinc-400">{t >= plan.total ? "Selesai." : now ? `Minggu ke-${Math.ceil(t) }: ${now.label}${now.kind === "ulang" ? " (pengerjaan ulang)" : ""}` : "Belum mulai."}</p>
    </div>
  );
}

function Stat({ label, wf, ag, unit }: { label: string; wf: number; ag: number; unit?: string }) {
  const f = (v: number) => `${v}${unit ? ` ${unit}` : ""}`;
  return (
    <div className="min-w-0 rounded-xl border border-zinc-700 bg-black/30 p-2">
      <p className="text-[11px] leading-4 text-zinc-400">{label}</p>
      <p className="mt-1 text-xs font-bold text-zinc-200">Waterfall <span className="text-sm">{f(wf)}</span></p>
      <p className="text-xs font-bold text-[#b5d36f]">Agile <span className="text-sm">{f(ag)}</span></p>
    </div>
  );
}

export default function SdlcWaterfallAgile({ title }: { title: string }) {
  const [change, setChange] = useState(false);
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);

  const wf = waterfall(change);
  const ag = agile(change);
  const end = Math.max(wf.total, ag.total);
  const scale = waterfall(true).total;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setT((x) => {
      if (x + 1 >= end) { setRunning(false); return end; }
      return x + 1;
    }), 500);
    return () => clearInterval(id);
  }, [running, end]);

  const toggle = () => { setChange((c) => !c); setT(0); setRunning(false); };
  const step = () => setT((x) => Math.min(end, x + 1));
  const run = () => {
    if (reducedMotion()) { setT(end); return; }
    setT(t >= end ? 0 : t); setRunning(true);
  };
  const done = t >= end;

  return (
    <Frame title={title} hint="Dua cara mengerjakan proyek yang sama dengan 6 fitur. Tekan Langkah atau Jalankan, lalu nyalakan perubahan kebutuhan dan bandingkan hasilnya.">
      <div className="sim-stage space-y-4 p-3 sm:p-4">
        <Lane name="Waterfall" plan={wf} t={t} scale={scale} accent="#a5a79b" />
        <Lane name="Agile (Scrum)" plan={ag} t={t} scale={scale} accent="#b5d36f" />
        <p className="text-right text-[11px] text-zinc-500">Skala sama: 1 minggu per langkah. Kotak hijau = fitur yang sudah berfungsi.</p>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Software pertama berfungsi" wf={wf.firstWorking} ag={ag.firstWorking} unit="mgg" />
          <Stat label="Total pengerjaan ulang" wf={wf.rework} ag={ag.rework} unit="mgg" />
          <Stat label="Momen umpan balik" wf={wf.feedback} ag={ag.feedback} unit="kali" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={step} disabled={done || running} className={simButton}>Langkah +1 minggu</button>
        <button type="button" onClick={run} disabled={running} className={simGhost}>{done ? "Ulangi" : "Jalankan"}</button>
        <button type="button" onClick={() => { setT(0); setRunning(false); }} className={simGhost}>Atur ulang</button>
        <button type="button" aria-pressed={change} onClick={toggle} className={`${simGhost} aria-pressed:bg-noir aria-pressed:text-on-noir`}>Kebutuhan berubah di tengah jalan</button>
      </div>
      <p aria-live="polite" className="mt-3 text-sm text-zinc-400">
        {!done ? `Minggu ke-${t} dari ${end}.`
          : change
            ? `Waterfall harus mengulang kebutuhan dan desain (${wf.rework} minggu ulang, selesai minggu ${wf.total}). Agile cukup mengulang ${ag.rework} fitur di sprint berikutnya (selesai minggu ${ag.total}).`
            : `Waterfall baru menunjukkan software di minggu ${wf.total}. Agile sudah punya software yang berfungsi di minggu ${ag.firstWorking}, dengan ${ag.feedback} kali umpan balik.`}
      </p>
    </Frame>
  );
}
