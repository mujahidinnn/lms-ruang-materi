import { useState } from "react";
import Frame, { G, Glow } from "./Frame";

const VCC = 5;
const W = 400;

export default function Pwm({ title }: { title: string }) {
  const [duty, setDuty] = useState(30);
  const [cycles, setCycles] = useState(4);
  const w = W / cycles;
  const hi = (w * duty) / 100;
  // One extra period so the scrolling trace never shows a gap.
  const d = Array.from({ length: cycles + 1 }, (_, i) => `M${i * w} 78V22H${i * w + hi}V78H${(i + 1) * w}`).join("");
  const avg = (VCC * duty) / 100;
  const avgY = 78 - (56 * duty) / 100;
  const k = duty / 100;

  return (
    <Frame title={title} hint="Geser duty cycle: gelombang tetap bertegangan 0 atau 5 V, tetapi rata-ratanya berubah, dan itulah yang dirasakan LED.">
      <div className="sim-stage grid gap-3 p-3 sm:grid-cols-[1fr_8rem] sm:items-center sm:p-4">
        <svg viewBox="0 0 400 100" role="img" aria-label={`Gelombang PWM dengan duty cycle ${duty} persen`} className="h-auto w-full overflow-hidden rounded-xl bg-[#0a0c06]">
          <Glow id="pwmglow" />
          {/* graticule */}
          {[22, 50, 78].map((y) => <line key={y} x1="0" x2={W} y1={y} y2={y} stroke="#2c3418" strokeWidth="1" />)}
          {Array.from({ length: 9 }, (_, i) => <line key={i} y1="0" y2="100" x1={i * 50} x2={i * 50} stroke="#2c3418" strokeWidth="1" />)}
          <g style={{ ["--sim-shift" as string]: `-${w}px` }} className="sim-scan">
            <path d={d} fill="none" stroke={G} strokeWidth="3" strokeLinejoin="round" filter="url(#pwmglow)" />
          </g>
          <line x1="0" x2={W} y1={avgY} y2={avgY} stroke="#fff" strokeWidth="1.5" strokeDasharray="6 5" />
          <text x="6" y="14" fontSize="9" fill="#8a9171">5 V</text>
          <text x="6" y="94" fontSize="9" fill="#8a9171">0 V</text>
        </svg>

        <svg viewBox="0 0 120 130" role="img" aria-label={`LED menyala ${duty} persen`} className="mx-auto h-32 w-28">
          <Glow id="ledglow" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <line key={i} x1={60 + Math.cos(a) * 36} y1={52 + Math.sin(a) * 36} x2={60 + Math.cos(a) * (38 + 16 * k)} y2={52 + Math.sin(a) * (38 + 16 * k)} stroke={G} strokeWidth="3" strokeLinecap="round" opacity={0.15 + 0.85 * k} />;
          })}
          <path d="M42 78V50a18 18 0 0 1 36 0v28Z" fill={G} opacity={0.12 + 0.88 * k} filter={k > 0.1 ? "url(#ledglow)" : undefined} />
          <path d="M42 78V50a18 18 0 0 1 36 0v28Z" fill="none" stroke="#e8efd6" strokeWidth="2.5" />
          <rect x="38" y="78" width="44" height="6" rx="2" fill="#e8efd6" />
          <path d="M52 84v34M68 84v26" stroke="#e8efd6" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold">Duty cycle: {duty}%
          <input type="range" min={0} max={100} step={5} value={duty} onChange={(e) => setDuty(+e.target.value)} className="min-h-11 w-full accent-[var(--color-matcha-400)]" />
        </label>
        <label className="grid gap-1 text-sm font-bold">Siklus yang ditampilkan: {cycles}
          <input type="range" min={2} max={8} value={cycles} onChange={(e) => setCycles(+e.target.value)} className="min-h-11 w-full accent-[var(--color-matcha-400)]" />
        </label>
      </div>
      <p className="mt-1 text-sm text-zinc-400">Tegangan rata-rata = {VCC} V × {duty}% = <strong className="text-current">{avg.toFixed(2)} V</strong></p>
    </Frame>
  );
}
