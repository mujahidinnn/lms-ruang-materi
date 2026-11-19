import { simChip } from "./Frame";

// A labelled single-choice group of chips, shared by the CSS simulations.
export default function Chips<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-1">
      <span className="text-sm font-bold">{label}</span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1 rounded-2xl border-2 border-noir bg-zinc-800 p-1">
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)} className={simChip}>{o}</button>
        ))}
      </div>
    </div>
  );
}

export const range = "min-h-11 w-full accent-[var(--color-matcha-400)]";
export const snippet = "mt-3 overflow-x-auto rounded-xl bg-[#0a0c06] p-3 font-mono text-xs leading-relaxed text-matcha-300";
