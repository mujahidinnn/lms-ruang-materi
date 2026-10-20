// A progress ring. The number is always printed next to or inside it, so the
// ring itself is decoration for screen readers.
export default function Ring({ value, max, className = "size-11", stroke = 5, children }: { value: number; max: number; className?: string; stroke?: number; children?: React.ReactNode }) {
  const r = 20 - stroke / 2;
  const c = 2 * Math.PI * r;
  const pct = max ? Math.min(1, value / max) : 0;
  return (
    <span className={`relative inline-grid shrink-0 place-items-center ${className}`}>
      <svg viewBox="0 0 40 40" aria-hidden className="absolute inset-0 size-full -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth={stroke} className="stroke-zinc-800" />
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className={pct ? "stroke-brand" : "stroke-transparent"} />
      </svg>
      {children}
    </span>
  );
}
