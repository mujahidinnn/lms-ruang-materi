import { useMemo, useState } from "react";
import Frame, { simButton, simChip, simGhost } from "./Frame";
import { PRESETS, run } from "../../../lib/sim/event-loop";

function Lane({ name, items, tone, top }: { name: string; items: string[]; tone: string; top?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-bold sm:text-xs" style={{ color: tone }}>{name}</p>
      <div className={`flex min-h-28 gap-1 rounded-xl border-2 border-dashed border-zinc-700 p-1 ${top ? "flex-col-reverse justify-start" : "flex-col"}`}>
        {items.map((s, i) => (
          <span key={`${s}${i}`} className="sim-pop rounded-lg px-1.5 py-1 text-center text-[10px] font-bold break-words text-[#12140d] sm:text-xs" style={{ background: tone }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

export default function EventLoop({ title }: { title: string }) {
  const [pi, setPi] = useState(1);
  const [n, setN] = useState(0);
  const preset = PRESETS[pi];
  const steps = useMemo(() => run(preset.program), [preset]);
  const s = steps[n];
  const done = n === steps.length - 1;

  return (
    <Frame title={title} hint="Maju satu langkah dan lihat di mana setiap callback menunggu: call stack, microtask queue, atau task queue.">
      <div className="flex flex-wrap gap-1 rounded-3xl bg-zinc-800 p-1" role="group" aria-label="Contoh kode">
        {PRESETS.map((p, i) => <button key={p.name} type="button" aria-pressed={pi === i} onClick={() => { setPi(i); setN(0); }} className={`${simChip} grow`}>{p.name}</button>)}
      </div>

      <div className="sim-stage mt-3 p-3 sm:p-4">
        <pre className="overflow-x-auto rounded-lg bg-black/40 py-2 text-xs sm:text-sm" aria-label="Kode contoh">
          {preset.code.map((l, i) => (
            <code key={i} className={`block px-3 whitespace-pre ${i === s.line && n > 0 && !(s.stack.length === 0) ? "bg-[#b5d36f]/20 text-[#b5d36f]" : "text-zinc-300"}`}>{l}</code>
          ))}
        </pre>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Lane name="Call stack" items={s.stack} tone="#b5d36f" top />
          <Lane name="Microtask" items={s.micro} tone="#c9a8ff" />
          <Lane name="Task (timer)" items={s.macro} tone="#f2c879" />
        </div>

        <div className="mt-3 rounded-xl bg-black/40 px-3 py-2 font-mono text-sm" aria-label="Output console">
          <span className="text-zinc-500">console: </span>
          <span className="font-bold text-[#e8efd6]">{s.out.length ? s.out.join("  ") : "(kosong)"}</span>
        </div>
        <p role="status" className="mt-2 text-sm font-bold text-[#b5d36f]">{s.note}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={simButton} disabled={done} onClick={() => setN(n + 1)}>Langkah berikutnya</button>
        <button type="button" className={simGhost} disabled={n === 0} onClick={() => setN(n - 1)}>Mundur</button>
        <button type="button" className={simGhost} disabled={n === 0} onClick={() => setN(0)}>Ulangi</button>
        <span className="text-sm text-zinc-400">Langkah {n + 1} dari {steps.length}</span>
      </div>
    </Frame>
  );
}
