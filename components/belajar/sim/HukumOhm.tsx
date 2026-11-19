import { useState } from "react";
import Frame, { G, Glow, reducedMotion } from "./Frame";
import { RATING_W, fmt, ohm, overRating } from "../../../lib/sim/ohm";

const PATH = "M60 120V30H300V120Z";
const HOT = "#ff6b4a";
const range = "min-h-11 w-full accent-[var(--color-matcha-400)]";

export default function HukumOhm({ title }: { title: string }) {
  const [v, setV] = useState(5);
  const [r, setR] = useState(330);
  const { i, p } = ohm(v, r);
  const hot = overRating(p);
  // Skala log: 1 mA..1 A -> 8 s..1,5 s per putaran.
  const s = Math.max(0, Math.min(1, (Math.log10(Math.max(i, 1e-6)) + 3) / 3));
  const dur = 8 - 6.5 * s;
  const still = reducedMotion();
  const glow = Math.min(1, i / 0.02);
  const wire = hot ? HOT : G;

  return (
    <Frame title={title} hint="Geser tegangan dan hambatan: arus dan daya berubah seketika. Lewati batas ¼ W dan resistornya kepanasan.">
      <div className="sim-stage p-3 sm:p-4">
        <svg viewBox="0 0 360 160" role="img" aria-label={`Rangkaian baterai ${v} volt, resistor ${r} ohm, dan lampu; arus ${fmt(i, "A")}`} className="h-auto w-full">
          <Glow id="ohmglow" />
          <path d={PATH} fill="none" stroke="#3b4326" strokeWidth="3" strokeLinejoin="round" />
          {/* baterai */}
          <rect x="44" y="62" width="32" height="26" fill="#12140d" />
          <path d="M48 66h24M54 76h12M48 84h24" stroke="#e8efd6" strokeWidth="3" strokeLinecap="round" />
          <text x="82" y="68" fontSize="11" fill={G} fontWeight="700">+</text>
          <text x="86" y="82" fontSize="11" fill="#e8efd6" fontWeight="700">{v} V</text>
          {/* resistor */}
          <rect x="122" y="18" width="116" height="24" fill="#12140d" />
          <path d="M126 30h14l6-10 12 20 12-20 12 20 12-20 6 10h26" fill="none" stroke={hot ? HOT : "#e8efd6"} strokeWidth="3" strokeLinejoin="round" filter={hot ? "url(#ohmglow)" : undefined} className={hot ? "sim-blink" : undefined} />
          {hot && [150, 180, 210].map((x) => <path key={x} d={`M${x} 12c-4-4 4-6 0-10`} fill="none" stroke={HOT} strokeWidth="2" strokeLinecap="round" className="sim-blink" />)}
          <text x="180" y="58" fontSize="11" textAnchor="middle" fill={hot ? HOT : "#8a9171"} fontWeight="700">{r} Ω · ¼ W</text>
          {/* lampu */}
          <circle cx="300" cy="75" r="20" fill={G} opacity={0.08 + 0.92 * glow} filter={glow > 0.1 ? "url(#ohmglow)" : undefined} />
          <circle cx="300" cy="75" r="20" fill="none" stroke="#e8efd6" strokeWidth="3" />
          <path d="M290 85l20-20M290 65l20 20" stroke="#e8efd6" strokeWidth="2.5" strokeLinecap="round" />
          {/* arus */}
          {i > 0 && Array.from({ length: 8 }, (_, k) => (
            <circle key={k} r="3.5" fill={wire} cx={still ? 60 + k * 30 : undefined} cy={still ? 30 : undefined}>
              {!still && <animateMotion dur={`${dur}s`} begin={`${-(k / 8) * dur}s`} repeatCount="indefinite" path={PATH} />}
            </circle>
          ))}
          <text x="8" y="154" fontSize="10" fill="#8a9171">arus mengalir dari kutub + ke kutub −</text>
        </svg>

        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <Readout label="Arus (I)" value={fmt(i, "A")} />
          <Readout label="Daya (P)" value={fmt(p, "W")} hot={hot} />
          <Readout label="Hambatan" value={`${r} Ω`} />
        </div>
        <p role="status" className={`mt-3 rounded-xl px-3 py-2 text-sm font-bold ${hot ? "bg-[#ff6b4a] text-[#12140d]" : "bg-zinc-800 text-zinc-300"}`}>
          {hot ? `Panas! ${fmt(p, "W")} melebihi batas ${RATING_W} W: resistor bisa gosong. Naikkan hambatan atau turunkan tegangan.` : `Aman: ${fmt(p, "W")} masih di bawah batas ${RATING_W} W.`}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold">Tegangan (V): {v} V
          <input type="range" min={1} max={12} step={0.5} value={v} onChange={(e) => setV(+e.target.value)} className={range} />
        </label>
        <label className="grid gap-1 text-sm font-bold">Hambatan (R): {r} Ω
          <input type="range" min={10} max={2000} step={10} value={r} onChange={(e) => setR(+e.target.value)} className={range} />
        </label>
      </div>
      <p className="mt-1 text-sm text-zinc-400">I = V / R = {v} / {r} = <strong className="text-current">{fmt(i, "A")}</strong>; P = V × I = <strong className="text-current">{fmt(p, "W")}</strong></p>
    </Frame>
  );
}

function Readout({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="rounded-xl bg-[#1d2213] px-1 py-2">
      <p className="text-[11px] text-[#a3ab8f]">{label}</p>
      <p className="text-base font-extrabold sm:text-lg" style={{ color: hot ? HOT : G }}>{value}</p>
    </div>
  );
}
