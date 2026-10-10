import Room from "./Room";

type Props = { label?: string; className?: string };

// Nothing due: one card filed away, checked.
export function NothingDue(props: Props) {
  return (
    <Room {...props}>
      <rect x="27" y="34" width="42" height="30" rx="6" className="fill-zinc-900 stroke-zinc-600" strokeWidth="4" />
      <path d="M38 49l7 7 13-13" className="stroke-brand" strokeWidth="5" />
    </Room>
  );
}

// Lulus: the slide stack with a check over it.
export function Passed(props: Props) {
  return (
    <Room {...props}>
      <rect x="36" y="27" width="34" height="24" rx="5" className="stroke-brand/50" strokeWidth="4" />
      <rect x="24" y="40" width="36" height="27" rx="5" className="fill-brand" />
      <path d="M34 54l6 6 11-11" className="stroke-zinc-950" strokeWidth="5" />
    </Room>
  );
}

// Belum lulus: a loop back around, not a cross.
export function TryAgain(props: Props) {
  return (
    <Room {...props}>
      <path d="M63 46a16 16 0 1 1-5-11" className="stroke-zinc-400" strokeWidth="5" />
      <path d="M60 25v11H49" className="stroke-zinc-400" strokeWidth="5" />
    </Room>
  );
}

// 404: an empty, dashed slot where the slide should be.
export function Missing(props: Props) {
  return (
    <Room {...props}>
      <rect x="25" y="33" width="46" height="32" rx="6" className="stroke-zinc-600" strokeWidth="4" strokeDasharray="7 7" />
    </Room>
  );
}
