import type { ReactNode } from "react";

// A scalloped sticker badge with an ink outline and a sparkle, the base of
// every illustration. Each one draws its content inside; tone picks the
// matcha shade. Colors come from classes.
const TONES = { foam: "fill-matcha-100", light: "fill-matcha-200", bright: "fill-matcha-300" } as const;
export type Tone = keyof typeof TONES;

// A 14-point star with soft points around (48, 50): the scalloped edge.
const SCALLOP = (() => {
  const n = 14, cx = 48, cy = 50, r = 37, bump = 4.5;
  const pts = Array.from({ length: n * 2 }, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2;
    const rr = i % 2 ? r - bump : r + bump;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  });
  return pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + "Z";
})();

const SPARK = "M84 6c.6 4 2.8 6.4 7 7.2-4.2.8-6.4 3.2-7 7.2-.6-4-2.8-6.4-7-7.2 4.2-.8 6.4-3.2 7-7.2Z";

export default function Badge({ label, tone = "light", className = "size-28", children }: { label?: string; tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <path d={SCALLOP} transform="translate(3 3)" className="fill-noir" />
      <path d={SCALLOP} className={`${TONES[tone]} stroke-noir`} strokeWidth="3" />
      <path d={SPARK} className="fill-noir" />
      {children}
    </svg>
  );
}
