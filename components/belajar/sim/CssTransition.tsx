import { useState } from "react";
import { bezier, EASINGS, type Easing } from "@/lib/sim/css";
import Chips, { range, snippet } from "./Chips";
import Frame, { G, simButton } from "./Frame";

const PROPS = ["transform", "opacity", "background"] as const;
const OFF = { transform: "translateX(0) rotate(0)", opacity: 1, background: "#7fb3d9" };
const ON = { transform: "translateX(var(--sim-dx)) rotate(180deg)", opacity: 0.25, background: "#f0b36a" };

export default function CssTransition({ title }: { title: string }) {
  const [easing, setEasing] = useState<Easing>("ease");
  const [ms, setMs] = useState(600);
  const [prop, setProp] = useState<(typeof PROPS)[number]>("transform");
  const [on, setOn] = useState(false);
  const t = EASINGS[easing];
  const s = on ? ON : OFF;
  const pts = Array.from({ length: 41 }, (_, i) => `${10 + (i / 40) * 100},${110 - bezier(t, i / 40) * 90}`).join(" ");

  return (
    <Frame title={title} hint="Klik kotak (atau tombol) untuk memicu perubahan. Kurva menunjukkan kecepatan: sumbu mendatar waktu, sumbu tegak progres.">
      <div className="sim-stage grid gap-3 p-3 sm:grid-cols-[1fr_9rem] sm:items-center">
        <div className="relative h-24 overflow-hidden rounded-lg bg-[#0a0c06]" style={{ ["--sim-dx" as string]: "calc(100cqw - 4.5rem)", containerType: "inline-size" }}>
          <button
            type="button"
            aria-pressed={on}
            aria-label="Kotak yang dianimasikan"
            onClick={() => setOn((v) => !v)}
            className="absolute left-3 top-1/2 -mt-6 size-12 rounded-lg border-2 border-noir"
            style={{ transform: prop === "transform" ? s.transform : OFF.transform, opacity: prop === "opacity" ? s.opacity : 1, background: prop === "background" ? s.background : OFF.background, transition: `${prop === "background" ? "background-color" : prop} ${ms}ms ${easing}` }}
          />
        </div>
        <svg viewBox="0 0 120 130" role="img" aria-label={`Kurva easing ${easing}`} className="mx-auto h-auto w-full max-w-[9rem]">
          <rect x="10" y="20" width="100" height="90" fill="none" stroke="#2c3418" />
          <line x1="10" y1="110" x2="110" y2="20" stroke="#2c3418" strokeDasharray="3 3" />
          <polyline points={pts} fill="none" stroke={G} strokeWidth="2.5" strokeLinejoin="round" />
          <text x="10" y="126" fontSize="8" fill="#8a9171">waktu</text>
          <text x="10" y="12" fontSize="8" fill="#8a9171">progres</text>
        </svg>
      </div>
      <div className="mt-3 grid gap-3">
        <Chips label="timing-function" value={easing} options={Object.keys(EASINGS) as Easing[]} onChange={setEasing} />
        <Chips label="Properti yang berubah" value={prop} options={PROPS} onChange={setProp} />
        <label className="grid gap-1 text-sm font-bold">duration: {ms}ms
          <input type="range" min={100} max={2000} step={100} value={ms} onChange={(e) => setMs(+e.target.value)} className={range} />
        </label>
        <div><button type="button" onClick={() => setOn((v) => !v)} className={simButton}>Picu transisi</button></div>
      </div>
      <pre className={snippet}>{`.kotak {\n  transition: ${prop === "background" ? "background-color" : prop} ${(ms / 1000).toFixed(1)}s ${easing};\n}\n.kotak:hover {\n  ${prop === "transform" ? "transform: translateX(200px) rotate(180deg);" : prop === "opacity" ? "opacity: 0.25;" : "background: #f0b36a;"}\n}`}</pre>
    </Frame>
  );
}
