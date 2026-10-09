import Link from "next/link";
import type { TrackSummary } from "@/lib/content";

// A track as its path: one dot per topic on a line, up to twelve.
export default function TrackCard({ track }: { track: TrackSummary }) {
  const dots = Math.min(track.nodeCount, 12);
  return (
    <li>
      <Link
        href={`/roadmap/${track.slug}`}
        className="group flex h-full flex-col rounded-xl border border-zinc-800/80 bg-zinc-950 p-6 transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span aria-hidden className="relative flex items-center justify-between">
          <span className="absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2 bg-zinc-800" />
          {Array.from({ length: dots }, (_, i) => (
            <span
              key={i}
              className={`relative size-2.5 rounded-full border-2 border-zinc-950 ${i === 0 ? "bg-accent" : "bg-zinc-700 group-hover:bg-zinc-600"}`}
            />
          ))}
        </span>
        <h3 className="mt-6 text-lg font-semibold tracking-tight group-hover:text-accent">{track.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-400">{track.description}</p>
        <p className="mt-4 text-xs text-zinc-500 tabular-nums">{track.nodeCount} topik</p>
      </Link>
    </li>
  );
}
