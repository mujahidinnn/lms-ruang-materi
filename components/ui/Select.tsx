"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// A styled dropdown in place of the OS <select>. Closes on Esc, outside
// click and pick; options are buttons, so Tab and Enter work.
export default function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${options.find((o) => o[0] === value)?.[1]}`}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-sm text-zinc-50 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <span><span className="text-zinc-500">{label} </span>{options.find((o) => o[0] === value)?.[1]}</span>
        <ChevronDown aria-hidden className={`size-4 text-zinc-400 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul role="listbox" aria-label={label} className="absolute right-0 z-20 mt-2 w-full min-w-48 rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-soft">
          {options.map(([key, text]) => (
            <li key={key} role="option" aria-selected={key === value}>
              <button
                type="button"
                onClick={() => { onChange(key); setOpen(false); trigger.current?.focus(); }}
                className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 text-left text-sm hover:bg-zinc-800 focus-visible:bg-zinc-800 focus-visible:outline-none ${key === value ? "font-semibold text-zinc-50" : "text-zinc-300"}`}
              >
                {text}
                {key === value && <Check aria-hidden className="size-4 text-accent" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
