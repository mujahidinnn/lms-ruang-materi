import { useState } from "react";
import { activeBreakpoint, BREAKPOINTS, classText, isActive, type Mode, resolve, RULES } from "@/lib/sim/responsive";
import Chips, { range, snippet } from "./Chips";
import Frame from "./Frame";

const MIN = 320, MAX = 1400;

export default function TailwindResponsive({ title }: { title: string }) {
  const [w, setW] = useState(375);
  const [mode, setMode] = useState<Mode>("mobile-first");
  const { winner } = resolve(mode, w);
  const pct = Math.max(22, (w / MAX) * 100);

  return (
    <Frame title={title} hint="Geser lebar layar atau pilih breakpoint. Prefiks yang menyala sedang aktif; yang terakhir menang.">
      <div className="sim-stage p-3">
        <div className="rounded-lg bg-[#0a0c06] p-2">
          <div className="mx-auto rounded-md border-2 border-matcha-300/60 bg-zinc-900 p-2 transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${pct}%` }} role="img" aria-label={`Halaman ${w}px menampilkan ${winner.cols} kolom`}>
            <div className="mb-2 h-2 rounded bg-zinc-700" />
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${winner.cols}, minmax(0, 1fr))` }}>
              {Array.from({ length: 4 }, (_, i) => <div key={i} className="grid h-10 place-items-center rounded bg-matcha-300 text-xs font-extrabold text-[#12140d]">{i + 1}</div>)}
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm font-bold text-zinc-100">{w}px: {winner.cols} kolom ({activeBreakpoint(w)})</p>
      </div>
      <div className="mt-3 grid gap-3">
        <label className="grid gap-1 text-sm font-bold">Lebar layar: {w}px
          <input type="range" min={MIN} max={MAX} step={1} value={w} onChange={(e) => setW(+e.target.value)} className={range} />
        </label>
        <Chips label="Lompat ke breakpoint" value={w} options={[375, ...BREAKPOINTS.map((b) => b.px)] as const} onChange={setW} />
        <Chips label="Cara membaca" value={mode} options={["mobile-first", "desktop-first"] as const} onChange={setMode} />
      </div>
      <pre className={snippet}>
        <span className="text-zinc-400">class="</span>grid{" "}
        {RULES[mode].map((r) => {
          const on = isActive(mode, r, w), win = r === winner;
          return <span key={r.prefix} className={win ? "rounded bg-matcha-300 px-1 font-bold text-[#12140d]" : on ? "text-matcha-300 underline" : "text-zinc-500 line-through"}>{r.prefix}grid-cols-{r.cols}{" "}</span>;
        })}
        <span className="text-zinc-400">"</span>
      </pre>
      <p className="mt-1 text-xs text-zinc-400" aria-live="polite">
        {mode === "mobile-first" ? "Mobile-first: tanpa prefiks berlaku untuk semua lebar, sm:/lg: menimpa mulai dari lebar itu ke atas (min-width)." : "Desktop-first: dasar untuk layar besar, max-lg:/max-sm: menimpa di bawah lebar itu (max-width)."} Total: <code>{classText(mode)}</code>
      </p>
    </Frame>
  );
}
