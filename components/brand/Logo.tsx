// The mark: a black app tile holding a four-point matcha sparkle, with a
// small foam dot, like a sticker on a laptop. Ruang Materi = a space where
// something clicks. The tile stays black in both themes.
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="9" className="fill-noir" />
      {/* A light edge, so the tile still reads on the dark theme's near-black page. */}
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="8.25" fill="none" strokeWidth="1.5" className="stroke-matcha-300/40" />
      <path d="M15 5c.8 5.4 3.7 8.6 9.5 10-5.8 1.4-8.7 4.6-9.5 10-.8-5.4-3.7-8.6-9.5-10C11.3 13.6 14.2 10.4 15 5Z" className="fill-matcha-300" />
      <circle cx="24.5" cy="24.5" r="2.5" className="fill-matcha-100" />
    </svg>
  );
}

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-(family-name:--font-bricolage) text-xl whitespace-nowrap font-extrabold tracking-tight text-zinc-50 ${className}`}>
      <LogoMark className="size-9 -rotate-6" />
      {/* Phones show the mark alone, so the header's buttons fit the width. */}
      <span className="max-sm:sr-only">Ruang Materi</span>
    </span>
  );
}
