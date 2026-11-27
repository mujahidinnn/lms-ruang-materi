import type React from "react";
import Badge from "./Badge";

type Props = { label?: string; className?: string };

// Ink drawings on matcha sticker badges (components/illustrations/Badge.tsx).

// Empty states stay quiet: thin zinc line icons, no sticker badge.
function Quiet({ label, className = "size-10", children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-zinc-600 ${className}`}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {children}
    </svg>
  );
}

// Nothing due: one card filed away, checked.
export function NothingDue(props: Props) {
  return (
    <Quiet {...props}>
      <rect x="10" y="12" width="28" height="24" rx="5" />
      <path d="M18 24l4 4 8-8" />
    </Quiet>
  );
}

// Lulus: a big check on the brightest badge.
export function Passed(props: Props) {
  return (
    <Badge tone="bright" {...props}>
      <path d="M32 51l11 11 21-22" className="stroke-noir" strokeWidth="7" />
    </Badge>
  );
}

// Belum lulus: a loop back around, not a cross.
export function TryAgain(props: Props) {
  return (
    <Badge tone="foam" {...props}>
      <path d="M63 50a15 15 0 1 1-5-11" className="stroke-noir" strokeWidth="5" />
      <path d="M60 29v11H49" className="stroke-noir" strokeWidth="5" />
    </Badge>
  );
}

// 404: an empty, dashed card with a question mark.
export function Missing(props: Props) {
  return (
    <Quiet {...props}>
      <circle cx="21" cy="21" r="10" />
      <path d="M28.5 28.5L37 37" />
    </Quiet>
  );
}

// Dasbor greeting: a smiling face, Gen Z sticker style.
export function Welcome(props: Props) {
  return (
    <Badge tone="bright" {...props}>
      <circle cx="39" cy="44" r="3.5" className="fill-noir" />
      <circle cx="57" cy="44" r="3.5" className="fill-noir" />
      <path d="M35 55c3.5 6 8 9 13 9s9.5-3 13-9" className="stroke-noir" strokeWidth="4.5" />
    </Badge>
  );
}

// Data kosong: an empty inbox tray.
export function Empty(props: Props) {
  return (
    <Quiet {...props}>
      <path d="M8 26l5-12h22l5 12v8a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4Z" />
      <path d="M8 26h9l2 4h10l2-4h9" />
    </Quiet>
  );
}
