import Badge from "./Badge";

type Props = { label?: string; className?: string };

// Ink drawings on matcha sticker badges (components/illustrations/Badge.tsx).

// Nothing due: one card filed away, checked.
export function NothingDue(props: Props) {
  return (
    <Badge tone="foam" {...props}>
      <rect x="29" y="37" width="38" height="27" rx="6" className="fill-matcha-50 stroke-noir" strokeWidth="3" />
      <path d="M39 50l6 6 12-12" className="stroke-noir" strokeWidth="4" />
    </Badge>
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
    <Badge tone="light" {...props}>
      <rect x="27" y="35" width="42" height="30" rx="6" className="stroke-noir" strokeWidth="3" strokeDasharray="6 6" />
      <path d="M44 45a4 4 0 1 1 6 3.5c-1.5.8-2 1.7-2 3.5" className="stroke-noir" strokeWidth="3.5" />
      <circle cx="48" cy="58" r="2" className="fill-noir" />
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
