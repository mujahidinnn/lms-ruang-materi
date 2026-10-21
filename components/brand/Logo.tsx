// The mark: a room (rounded square, open at the top right corner) holding
// two stacked slides. Ruang Materi = material laid out in a space whose door
// is open to anyone; the gap also reads as growing outward, marked by a warm
// spark. Room in ink, the front slide matcha, the spark a sparkle. Colors come from classes
// so they flip with light and dark.
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <path
        d="M20 3H8a5 5 0 0 0-5 5v16a5 5 0 0 0 5 5h16a5 5 0 0 0 5-5V12"
        className="stroke-zinc-50"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="12.5" y="9.5" width="11" height="8" rx="1.75" className="stroke-zinc-50" strokeWidth="1.75" />
      <rect x="8" y="14" width="12" height="9" rx="1.75" className="fill-primary stroke-zinc-50" strokeWidth="1.5" />
      <path d="M10.75 17.5h6.5M10.75 20.25h3.5" className="stroke-zinc-50" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M27.5 1.5c.4 2 1.5 3.1 3.5 3.5-2 .4-3.1 1.5-3.5 3.5-.4-2-1.5-3.1-3.5-3.5 2-.4 3.1-1.5 3.5-3.5Z" className="fill-brand" />
    </svg>
  );
}

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 font-(family-name:--font-bricolage) text-xl whitespace-nowrap font-extrabold tracking-tight text-zinc-50 ${className}`}>
      <LogoMark className="size-9" />
      Ruang Materi
    </span>
  );
}
