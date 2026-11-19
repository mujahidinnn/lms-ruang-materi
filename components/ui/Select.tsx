"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const TRIGGER = "inline-flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm text-zinc-50 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

// A styled dropdown in place of the OS <select>. With `name` it also posts
// its value in a form. Closes on Esc, outside click and pick; options are
// buttons, so Tab and Enter work. `prefix` shows the label in the button.
export default function Select({
  label,
  value,
  options,
  onChange,
  name,
  prefix = false,
  className = "",
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange?: (v: string) => void;
  name?: string;
  prefix?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(value);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [seen, setSeen] = useState(value);
  if (seen !== value) { setSeen(value); setCurrent(value); }

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

  const text = options.find((o) => o[0] === current)?.[1] ?? "";
  return (
    <div ref={root} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={current} />}
      <button ref={trigger} type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${text}`} onClick={() => setOpen((o) => !o)} className={TRIGGER}>
        <span className="truncate">{prefix && <span className="mr-1.5 text-zinc-500">{label}</span>}{text}</span>
        <ChevronDown aria-hidden className={`size-4 shrink-0 text-zinc-400 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul role="listbox" aria-label={label} className="absolute right-0 z-20 mt-2 max-h-72 w-full min-w-48 overflow-y-auto rounded-[18px] border border-zinc-800 bg-zinc-900 p-1.5 shadow-soft">
          {options.map(([key, optionText]) => (
            <li key={key} role="option" aria-selected={key === current}>
              <button
                type="button"
                onClick={() => { setCurrent(key); onChange?.(key); setOpen(false); trigger.current?.focus(); }}
                className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 text-left text-sm hover:bg-zinc-800 focus-visible:bg-zinc-800 focus-visible:outline-none ${key === current ? "font-semibold text-zinc-50" : "text-zinc-300"}`}
              >
                {optionText}
                {key === current && <Check aria-hidden className="size-4 shrink-0 text-accent" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
