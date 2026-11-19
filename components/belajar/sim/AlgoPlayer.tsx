import { useEffect, useState } from "react";
import { simButton, simChip, simGhost } from "./Frame";

// Step player for the algorithm sims. Playback is always started by the person, never automatic.
export function usePlayer(len: number) {
  const [i, setI] = useState(0);
  const [on, setOn] = useState(false);
  const [speed, setSpeed] = useState(1);
  const last = Math.max(0, len - 1);
  const idx = Math.min(i, last);
  const playing = on && idx < last;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setI(idx + 1), 1000 / speed);
    return () => clearTimeout(t);
  }, [playing, idx, speed]);
  return {
    i: idx, last, playing, speed, setSpeed,
    toggle: () => { if (playing) setOn(false); else { if (idx >= last) setI(0); setOn(true); } },
    step: () => { setOn(false); setI(Math.min(idx + 1, last)); },
    reset: () => { setOn(false); setI(0); },
  };
}

export type Player = ReturnType<typeof usePlayer>;

export function PlayerControls({ p }: { p: Player }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button type="button" onClick={p.toggle} aria-label={p.playing ? "Jeda animasi" : "Putar animasi"} className={`${simButton} w-24`}>{p.playing ? "Jeda" : "Putar"}</button>
      <button type="button" onClick={p.step} disabled={p.i >= p.last} aria-label="Langkah berikutnya" className={simGhost}>Langkah</button>
      <button type="button" onClick={p.reset} disabled={p.i === 0} aria-label="Ulangi dari awal" className={simGhost}>Ulang</button>
      <div role="group" aria-label="Kecepatan" className="ml-auto flex rounded-full bg-zinc-800 p-0.5">
        {[0.5, 1, 2].map((s) => (
          <button key={s} type="button" aria-pressed={p.speed === s} onClick={() => p.setSpeed(s)} className={`${simChip} px-3`}>{s}x</button>
        ))}
      </div>
      <p className="w-full text-xs text-zinc-500">Langkah {p.i + 1} dari {p.last + 1}</p>
    </div>
  );
}
