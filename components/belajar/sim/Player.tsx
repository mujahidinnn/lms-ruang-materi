import { type ReactNode, useEffect, useState } from "react";
import { simButton, simGhost } from "./Frame";

const DELAYS = [900, 500, 250, 120, 50];

// Step cursor with play/pause. Never starts by itself, so reduced-motion users only ever see steps they asked for.
export function usePlayer(len: number) {
  const [at, setAt] = useState(0);
  const [on, setOn] = useState(false);
  const [speed, setSpeed] = useState(3);
  const last = len - 1;
  const i = Math.min(at, last);
  const playing = on && i < last;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setAt(i + 1), DELAYS[speed - 1]);
    return () => clearTimeout(t);
  }, [playing, i, speed]);
  return {
    i, last, playing, speed, setSpeed,
    toggle: () => { if (playing) { setOn(false); return; } if (i >= last) setAt(0); setOn(true); },
    step: () => { setOn(false); setAt(Math.min(i + 1, last)); },
    reset: () => { setOn(false); setAt(0); },
  };
}

export function Controls({ p, children }: { p: ReturnType<typeof usePlayer>; children?: ReactNode }) {
  return (
    <div className="mt-4 grid gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={simButton} onClick={p.toggle} aria-label={p.playing ? "Jeda animasi" : "Putar animasi"}>{p.playing ? "Jeda" : p.i >= p.last ? "Putar ulang" : "Putar"}</button>
        <button type="button" className={simGhost} onClick={p.step} disabled={p.i >= p.last} aria-label="Maju satu langkah">Langkah</button>
        <button type="button" className={simGhost} onClick={p.reset} aria-label="Kembali ke awal">Ulang</button>
        {children}
      </div>
      <label className="grid gap-1 text-sm font-bold">Kecepatan
        <input type="range" min={1} max={5} value={p.speed} onChange={(e) => p.setSpeed(+e.target.value)} className="min-h-11 w-full accent-[var(--color-matcha-400)]" aria-label="Kecepatan animasi" />
      </label>
    </div>
  );
}
