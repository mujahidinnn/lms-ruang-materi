import { useState } from "react";
import { contrast, parseHex, verdicts } from "@/lib/sim/kontras";
import Frame, { simGhost } from "./Frame";

const PRESETS = [
  { n: "Hitam di putih", fg: "#000000", bg: "#ffffff" },
  { n: "Abu tua di putih", fg: "#595959", bg: "#ffffff" },
  { n: "Abu muda di putih", fg: "#aaaaaa", bg: "#ffffff" },
  { n: "Putih di biru", fg: "#ffffff", bg: "#1d4ed8" },
  { n: "Merah di hijau", fg: "#d62828", bg: "#2a9d3f" },
  { n: "Kuning di putih", fg: "#f4d03f", bg: "#ffffff" },
];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const ok = !!parseHex(value);
  const hex = ok ? "#" + parseHex(value)!.map((n) => n.toString(16).padStart(2, "0")).join("") : "#000000";
  return (
    <div className="grid gap-1">
      <label htmlFor={`k-${label}`} className="text-sm font-bold">{label}</label>
      <div className="flex gap-2">
        <input type="color" aria-label={`Pemilih warna ${label}`} value={hex} onChange={(e) => onChange(e.target.value)} className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border-2 border-noir bg-zinc-800 p-1" />
        <input id={`k-${label}`} value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} aria-invalid={!ok} className="min-h-11 min-w-0 flex-1 rounded-lg border-2 border-noir bg-zinc-800 px-3 font-mono text-sm text-zinc-100 aria-[invalid=true]:border-red-400" />
      </div>
      {!ok && <span className="text-xs text-red-400">Format hex tidak valid (contoh #1a2b3c).</span>}
    </div>
  );
}

export default function KontrasWarna({ title }: { title: string }) {
  const [fg, setFg] = useState("#595959");
  const [bg, setBg] = useState("#ffffff");
  const r = contrast(fg, bg);
  const valid = parseHex(fg) && parseHex(bg);
  const style = valid ? { color: fg, background: bg } : { color: "#a1a1aa", background: "#27272a" };

  return (
    <Frame title={title} hint="Pilih warna teks dan latar. Rasio kontras dihitung dengan rumus luminansi relatif WCAG.">
      <div className="sim-stage p-3">
        <div className="rounded-lg border border-zinc-600 p-4" style={style}>
          <p className="text-base">Teks normal 16px: Pendaftaran dibuka sampai Jumat.</p>
          <p className="mt-2 text-2xl font-bold">Teks besar 24px tebal</p>
        </div>
        <div className="mt-3 flex items-baseline gap-2" aria-live="polite">
          <span className="text-3xl font-extrabold text-matcha-300">{r ? r.toFixed(2) : "-"}</span>
          <span className="text-sm text-zinc-300">: 1 rasio kontras</span>
        </div>
        <ul className="mt-2 grid gap-2 sm:grid-cols-3">
          {(r ? verdicts(r) : []).map((v) => (
            <li key={v.label} className={`rounded-lg border-2 px-3 py-2 text-sm font-bold ${v.ok ? "border-matcha-300 text-matcha-300" : "border-red-400 text-red-400"}`}>
              {v.ok ? "Lulus" : "Gagal"}: {v.label} <span className="font-normal text-zinc-400">(min {v.min}:1)</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ColorField label="Warna teks" value={fg} onChange={setFg} />
        <ColorField label="Warna latar" value={bg} onChange={setBg} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Pasangan contoh">
        {PRESETS.map((p) => (
          <button key={p.n} type="button" className={simGhost} onClick={() => { setFg(p.fg); setBg(p.bg); }}>{p.n}</button>
        ))}
        <button type="button" className={simGhost} onClick={() => { setFg(bg); setBg(fg); }}>Tukar</button>
      </div>
    </Frame>
  );
}
