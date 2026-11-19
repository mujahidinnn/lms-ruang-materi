import { useState } from "react";
import Chips, { range, snippet } from "./Chips";
import Frame from "./Frame";

const W = 120;
const LAYERS = [
  ["margin", "#f0b36a"],
  ["border", "#e8efd6"],
  ["padding", "#b5d36f"],
  ["konten", "#7fb3d9"],
] as const;

export default function BoxModel({ title }: { title: string }) {
  const [m, setM] = useState(16);
  const [b, setB] = useState(4);
  const [p, setP] = useState(16);
  const [sizing, setSizing] = useState<"content-box" | "border-box">("content-box");
  const border = sizing === "border-box";
  const content = border ? Math.max(0, W - 2 * (p + b)) : W;
  const total = content + 2 * (p + b);
  const vals = [m, b, p, content];

  return (
    <Frame title={title} hint="Atur margin, border, dan padding. Perhatikan lebar kotak berubah atau tidak, tergantung box-sizing.">
      <div className="sim-stage flex min-h-[19rem] items-center justify-center overflow-hidden p-3">
        <div role="img" aria-label={`Kotak dengan margin ${m}px, border ${b}px, padding ${p}px, lebar konten ${content}px`} style={{ padding: m, background: "rgb(240 179 106 / 0.22)", outline: "1px dashed #f0b36a" }} className="transition-[padding] duration-200">
          <div style={{ border: `${b}px solid #e8efd6`, background: "rgb(181 211 111 / 0.3)", padding: p }} className="transition-all duration-200">
            <div style={{ width: content, minHeight: 36 }} className="grid place-items-center overflow-hidden bg-[#7fb3d9] text-xs font-bold text-[#12140d] transition-[width] duration-200">{content}px</div>
          </div>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {LAYERS.map(([n, c], i) => (
          <li key={n} className="flex items-center gap-1.5"><span aria-hidden className="size-3 rounded-sm" style={{ background: c }} />{n} <strong>{vals[i]}px</strong></li>
        ))}
      </ul>
      <div className="mt-3 grid gap-x-4 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-bold">margin: {m}px<input type="range" min={0} max={30} value={m} onChange={(e) => setM(+e.target.value)} className={range} /></label>
        <label className="grid gap-1 text-sm font-bold">border: {b}px<input type="range" min={0} max={12} value={b} onChange={(e) => setB(+e.target.value)} className={range} /></label>
        <label className="grid gap-1 text-sm font-bold">padding: {p}px<input type="range" min={0} max={30} value={p} onChange={(e) => setP(+e.target.value)} className={range} /></label>
      </div>
      <Chips label="box-sizing" value={sizing} options={["content-box", "border-box"] as const} onChange={setSizing} />
      <p className="mt-3 text-sm text-zinc-400">
        {border ? <>Lebar {W}px sudah termasuk padding dan border, jadi konten menyusut jadi {content}px.</> : <>Lebar {W}px hanya untuk konten, jadi kotak melebar jadi <strong className="text-current">{total}px</strong> (tanpa margin).</>}
      </p>
      <pre className={snippet}>{`.kotak {\n  box-sizing: ${sizing};\n  width: ${W}px;\n  margin: ${m}px;\n  border: ${b}px solid;\n  padding: ${p}px;\n}`}</pre>
    </Frame>
  );
}
