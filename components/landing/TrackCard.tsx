import Link from "next/link";
import ArrowBadge from "@/components/ui/ArrowBadge";
import { card, mutedChip } from "@/components/ui/styles";
import type { TrackSummary } from "@/lib/content";

// A track as its path: one dot per topic on a line, up to twelve.
export default function TrackCard({ track }: { track: TrackSummary }) {
  const dots = Math.min(track.nodeCount, 12);
  return (
    <li>
      <Link
        href={`/roadmap/${track.slug}`}
        className={`group flex h-full flex-col p-6 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none ${card}`}
      >
        <div className="flex items-start justify-between gap-3">
          <span className={`${mutedChip} tabular-nums`}>{track.nodeCount} topik</span>
          <ArrowBadge />
        </div>
        <h3 className="mt-5 text-2xl leading-tight font-bold tracking-tight">{track.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-400">{track.description}</p>
        <span aria-hidden className="relative mt-6 flex items-center justify-between">
          <span className="absolute inset-x-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-800" />
          {Array.from({ length: dots }, (_, i) => (
            <span key={i} className={`relative size-3 rounded-full ring-4 ring-zinc-900 ${i === 0 ? "bg-accent" : "bg-zinc-700"}`} />
          ))}
        </span>
      </Link>
    </li>
  );
}
