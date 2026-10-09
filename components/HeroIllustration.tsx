export default function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 440 360"
      fill="none"
      className="h-auto w-full max-w-sm"
      role="img"
      aria-label="Ilustrasi tumpukan slide materi interaktif"
    >
      <circle cx="220" cy="180" r="170" className="fill-accent/5" />

      <g className="fill-zinc-800/60">
        <circle cx="60" cy="70" r="3" />
        <circle cx="90" cy="55" r="3" />
        <circle cx="380" cy="90" r="3" />
        <circle cx="400" cy="280" r="3" />
        <circle cx="50" cy="290" r="3" />
        <circle cx="70" cy="310" r="3" />
      </g>

      <g transform="translate(220 190) rotate(-9) translate(-140 -105)">
        <rect
          width="280"
          height="210"
          rx="14"
          className="fill-zinc-900 stroke-zinc-800"
          strokeWidth="1.5"
        />
      </g>

      <g transform="translate(220 190) rotate(6) translate(-140 -105)">
        <rect
          width="280"
          height="210"
          rx="14"
          className="fill-zinc-900 stroke-zinc-800"
          strokeWidth="1.5"
        />
      </g>

      <g transform="translate(220 190) translate(-140 -105)">
        <rect
          width="280"
          height="210"
          rx="14"
          className="fill-zinc-950 stroke-accent/40"
          strokeWidth="1.5"
        />

        <rect x="24" y="28" width="44" height="44" rx="10" className="fill-accent" />
        <path
          d="M40 50h20M40 42h20M40 58h12"
          className="stroke-zinc-950"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <rect x="24" y="96" width="180" height="10" rx="5" className="fill-zinc-700" />
        <rect x="24" y="118" width="230" height="10" rx="5" className="fill-zinc-800" />
        <rect x="24" y="140" width="150" height="10" rx="5" className="fill-zinc-800" />

        <rect x="24" y="172" width="72" height="24" rx="12" className="fill-accent/15" />
        <rect x="34" y="181" width="52" height="6" rx="3" className="fill-accent" />
      </g>
    </svg>
  );
}
