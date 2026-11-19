import type { ReactNode } from "react";

export const simButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-noir bg-matcha-300 px-4 text-sm font-bold text-noir disabled:opacity-50";
export const simGhost = "inline-flex min-h-11 items-center justify-center rounded-full border-2 border-noir bg-zinc-800 px-4 text-sm font-bold disabled:opacity-40";
export const simChip = "min-h-11 rounded-full px-4 text-sm font-bold aria-pressed:bg-noir aria-pressed:text-on-noir text-zinc-300";

// Shared card for every simulation: title, hint, stage, controls.
export default function Frame({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <figure className="not-prose my-6 rounded-[18px] border-2 border-noir bg-zinc-900 p-4 shadow-soft sm:p-6">
      <figcaption className="mb-4">
        <p className="text-lg font-extrabold">{title}</p>
        <p className="mt-1 text-sm text-zinc-400">{hint}</p>
      </figcaption>
      {children}
    </figure>
  );
}

export const G = "#b5d36f"; // matcha-300
export const INK = "#12140d";

export function Glow({ id = "simglow" }: { id?: string }) {
  return (
    <defs>
      <filter id={id} x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="3" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <linearGradient id="simhex" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d6ea9c" /><stop offset="1" stopColor="#96bb45" /></linearGradient>
    </defs>
  );
}

export const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
