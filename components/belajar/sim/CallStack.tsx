import { useMemo, useState } from "react";
import { type Fn, trace } from "../../../lib/sim/call-stack";
import Frame, { G, INK, simChip } from "./Frame";
import { PlayerControls, usePlayer } from "./AlgoPlayer";

const AMBER = "#f2c879";
const MAX: Record<Fn, number> = { faktorial: 6, fibonacci: 5 };

export default function CallStack({ title }: { title: string }) {
  const [fn, setFn] = useState<Fn>("faktorial");
  const [n, setN] = useState(4);
  const steps = useMemo(() => trace(fn, n), [fn, n]);
  const p = usePlayer(steps.length);
  const s = steps[p.i];
  const top = s.stack.length - 1;
  const change = (f: () => void) => { f(); p.reset(); };

  return (
    <Frame title={title} hint="Atur n, lalu ikuti frame yang masuk ke stack, kasus dasar yang menjawab langsung, dan nilai yang dikembalikan ke pemanggilnya.">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Fungsi" className="flex rounded-full bg-zinc-800 p-0.5">
          {(["faktorial", "fibonacci"] as Fn[]).map((f) => (
            <button key={f} type="button" aria-pressed={fn === f} onClick={() => change(() => { setFn(f); setN(Math.min(n, MAX[f])); })} className={simChip}>{f}(n)</button>
          ))}
        </div>
        <label className="flex min-h-11 flex-1 items-center gap-3 text-sm font-bold">
          n = {n}
          <input type="range" min={1} max={MAX[fn]} value={n} onChange={(e) => change(() => setN(Number(e.target.value)))} aria-label="Nilai n" className="min-w-0 flex-1 accent-[#b5d36f]" />
        </label>
      </div>

      <div className="sim-stage mt-3 p-3">
        <div className="flex min-h-72 flex-col justify-end gap-1.5 sm:min-h-80" role="img" aria-label={`Call stack berisi ${s.stack.length} frame${s.stack.length ? `, teratas ${s.stack[top].label}` : ""}`}>
          {s.stack.length === 0 && <p className="py-10 text-center text-sm text-zinc-500">Stack kosong</p>}
          {[...s.stack].reverse().map((f, k) => {
            const isTop = k === 0;
            const bg = f.base ? G : "#1c1f14";
            const done = f.ret !== null;
            return (
              <div key={f.id} className={`${isTop ? "sim-pop " : ""}flex min-h-11 items-center justify-between gap-2 rounded-xl border-2 px-3 py-1.5 text-sm`}
                style={{ marginLeft: `${(s.stack.length - 1 - k) * 6}px`, background: bg, color: f.base ? INK : "#f4f7ea", borderColor: isTop ? (done ? AMBER : G) : "#52525b", boxShadow: isTop ? `0 0 14px ${done ? AMBER : G}55` : undefined }}>
                <span className="font-extrabold">{f.label}</span>
                <span className="min-w-0 flex-1 truncate text-right text-xs" style={{ opacity: 0.85 }}>{f.note}</span>
                {done && <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-extrabold" style={{ background: f.base ? INK : AMBER, color: f.base ? G : INK }}>return {f.ret}</span>}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-center text-xs text-zinc-500" aria-hidden>dasar stack di bawah, frame terbaru di atas</p>
      </div>

      <p aria-live="polite" className="mt-3 min-h-12 text-sm text-zinc-300">{s.text}</p>
      <PlayerControls p={p} />
    </Frame>
  );
}
