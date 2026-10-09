// Small card with a bar, like "1 dari 13 topik terbit". Value is in text,
// the bar only repeats it.
export default function ProgressStat({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">
        {value} <span className="text-sm font-normal text-zinc-500">dari {max}</span>
      </p>
      <div aria-hidden className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
