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

// Tidak ada hasil: a magnifier.
export function NoResults(props: Props) {
  return (
    <Quiet {...props}>
      <circle cx="21" cy="21" r="11" />
      <path d="M29 29l10 10" />
    </Quiet>
  );
}

// Semua beres: a check in a circle.
export function AllDone(props: Props) {
  return (
    <Quiet {...props}>
      <circle cx="24" cy="24" r="16" />
      <path d="M17 24.5l5 5 9-10" />
    </Quiet>
  );
}

// Belum cukup data: three bars on a baseline.
export function NoStats(props: Props) {
  return (
    <Quiet {...props}>
      <path d="M8 40h32" />
      <rect x="12" y="26" width="6" height="10" rx="1.5" />
      <rect x="21" y="18" width="6" height="18" rx="1.5" />
      <rect x="30" y="10" width="6" height="26" rx="1.5" />
    </Quiet>
  );
}

// Materi belum tersedia: an open book.
export function NoMaterial(props: Props) {
  return (
    <Quiet {...props}>
      <path d="M24 13c-4-3-10-4-16-3v25c6-1 12 0 16 3 4-3 10-4 16-3V10c-6-1-12 0-16 3Z" />
      <path d="M24 13v25" />
    </Quiet>
  );
}

// Peringkat, nilai, sertifikat: a trophy.
export function NoAwards(props: Props) {
  return (
    <Quiet {...props}>
      <path d="M15 9h18v9a9 9 0 0 1-18 0Z" />
      <path d="M15 12H9v3a6 6 0 0 0 6 6M33 12h6v3a6 6 0 0 1-6 6" />
      <path d="M24 27v7M17 39h14M19 39l1-5h8l1 5" />
    </Quiet>
  );
}

// Musik kosong: a music note, struck through.
export function NoMusic(props: Props) {
  return (
    <Quiet {...props}>
      <path d="M20 34V12l16-4v20" />
      <circle cx="15" cy="34" r="5" />
      <circle cx="31" cy="28" r="5" />
      <path d="M8 8l32 32" />
    </Quiet>
  );
}
