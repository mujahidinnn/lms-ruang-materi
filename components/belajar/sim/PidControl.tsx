import { useEffect, useMemo, useRef, useState } from "react";
import Frame, { G, reducedMotion, simGhost } from "./Frame";
import { DT, PRESETS, metrics, simulate } from "../../../lib/sim/pid";

const W = 400, H = 180, PAD = 8;
const range = "min-h-11 w-full accent-[var(--color-matcha-400)]";

export default function PidControl({ title }: { title: string }) {
  const [k, setK] = useState({ kp: 12, ki: 2, kd: 3 });
  const [sp, setSp] = useState(5);
  const pos = useMemo(() => simulate({ ...k, setpoint: sp }), [k, sp]);
  const m = metrics(pos, sp);
  const last = pos.length - 1;
  const [anim, setAnim] = useState<{ pos: number[]; idx: number } | null>(null);
  const raf = useRef(0);
  const shown = anim && anim.pos === pos ? Math.min(anim.idx, last) : last; // replay berlaku hanya untuk hasil simulasi yang sama

  const yMax = Math.max(sp * 1.5, Math.max(...pos) * 1.08);
  const x = (i: number) => (i / last) * W;
  const y = (v: number) => H - PAD - (Math.max(v, 0) / yMax) * (H - 2 * PAD);
  const pts = pos.map((v, i) => [i, v] as const).filter(([i]) => i <= shown && (i % 4 === 0 || i === shown)).map(([i, v]) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const replay = () => {
    cancelAnimationFrame(raf.current);
    if (reducedMotion()) return setAnim(null);
    const t0 = performance.now();
    const tick = (now: number) => {
      const f = Math.min(last, Math.round(((now - t0) / 4000) * last));
      setAnim({ pos, idx: f });
      if (f < last) raf.current = requestAnimationFrame(tick);
    };
    setAnim({ pos, idx: 0 });
    raf.current = requestAnimationFrame(tick);
  };

  const num = (label: string, key: "kp" | "ki" | "kd", max: number, step: number) => (
    <label className="grid gap-1 text-sm font-bold">{label}: {k[key]}
      <input type="range" min={0} max={max} step={step} value={k[key]} onChange={(e) => setK({ ...k, [key]: +e.target.value })} className={range} />
    </label>
  );

  return (
    <Frame title={title} hint="Robot harus berhenti di titik tujuan. Atur Kp, Ki, Kd dan lihat bagaimana posisinya mendekati setpoint.">
      <div className="sim-stage p-3 sm:p-4">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Grafik posisi terhadap waktu. Overshoot ${m.overshoot.toFixed(0)} persen`} className="h-auto w-full overflow-hidden rounded-xl bg-[#0a0c06]">
          {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="#2c3418" />)}
          <line x1="0" x2={W} y1={y(sp)} y2={y(sp)} stroke="#fff" strokeWidth="1.5" strokeDasharray="6 5" />
          <text x="6" y={y(sp) - 5} fontSize="10" fill="#e8efd6">setpoint {sp}</text>
          <polyline points={pts} fill="none" stroke={G} strokeWidth="2.5" strokeLinejoin="round" />
          <text x={W - 4} y={H - 4} fontSize="9" fill="#8a9171" textAnchor="end">{(last * DT).toFixed(0)} detik</text>
        </svg>
        {/* lintasan robot */}
        <div className="relative mt-3 h-9" aria-hidden>
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-zinc-700" />
          <div className="absolute top-0 h-9 w-0.5 bg-white/80" style={{ left: `${(sp / yMax) * 100}%` }} />
          <div className="absolute top-1.5 grid h-6 w-9 -translate-x-1/2 place-items-center rounded-lg bg-[#b5d36f] text-[10px] font-extrabold text-[#12140d]" style={{ left: `${Math.min(100, Math.max(0, (pos[shown] / yMax) * 100))}%` }}>robot</div>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[["Overshoot", `${m.overshoot.toFixed(0)}%`], ["Waktu tenang", m.settle === null ? "belum" : `${m.settle.toFixed(1).replace(".", ",")} s`], ["Galat akhir", (m.finalErr).toFixed(2).replace(".", ",")]].map(([a, b]) => (
            <div key={a} className="rounded-xl bg-zinc-800/80 px-1 py-2"><dt className="text-[11px] text-zinc-400">{a}</dt><dd className="text-base font-extrabold text-[#b5d36f]">{b}</dd></div>
          ))}
        </dl>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Preset">
        {PRESETS.map((p) => <button key={p.name} type="button" className={simGhost} onClick={() => setK({ kp: p.kp, ki: p.ki, kd: p.kd })}>{p.name}</button>)}
        <button type="button" className={simGhost} onClick={replay}>Putar ulang</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {num("Kp", "kp", 40, 0.5)}
        {num("Ki", "ki", 20, 0.5)}
        {num("Kd", "kd", 10, 0.25)}
        <label className="grid gap-1 text-sm font-bold">Setpoint: {sp}
          <input type="range" min={1} max={10} step={0.5} value={sp} onChange={(e) => setSp(+e.target.value)} className={range} />
        </label>
      </div>
    </Frame>
  );
}
