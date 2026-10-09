import type { ReactNode } from "react";

// The logo's room at illustration size: open top right corner and the spark.
// Each illustration draws its content inside. Colors come from classes so
// they flip with light and dark.
export default function Room({ label, className = "size-28", children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <path d="M60 9H24A15 15 0 0 0 9 24v48a15 15 0 0 0 15 15h48a15 15 0 0 0 15-15V36" className="stroke-zinc-700" strokeWidth="6" />
      <circle cx="82" cy="15" r="5" className="fill-accent-warm" />
      {children}
    </svg>
  );
}
