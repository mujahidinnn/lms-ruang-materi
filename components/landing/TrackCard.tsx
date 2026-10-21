import { Code2, GitBranch, LayoutTemplate, Route, Server } from "lucide-react";
import ArrowBadge from "@/components/ui/ArrowBadge";
import { card, mutedChip } from "@/components/ui/styles";
import type { TrackSummary } from "@/lib/content";

// By a word in the track slug; anything else gets the route icon.
const ICONS = [
  [/frontend|web/, LayoutTemplate],
  [/git/, GitBranch],
  [/backend|server|api/, Server],
  [/python|program|dasar/, Code2],
] as const;

// A track as its path: one dot per topic on a line, up to twelve.
export default function TrackCard({ track }: { track: TrackSummary }) {
  const dots = Math.min(track.nodeCount, 12);
  const Icon = ICONS.find(([re]) => re.test(track.slug))?.[1] ?? Route;
  return (
    <li>
      <a
        href={`/roadmap/${track.slug}`}
        className={`group flex h-full flex-col p-6 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none ${card}`}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-14 -rotate-6 place-items-center rounded-[20px] border-2 border-noir bg-matcha-200 text-noir shadow-[3px_3px_0_0_var(--color-noir)] transition-transform group-hover:rotate-0">
            <Icon aria-hidden className="size-7" strokeWidth={1.75} />
          </span>
          <ArrowBadge />
        </div>
        <span className={`${mutedChip} mt-5 self-start tabular-nums`}>{track.nodeCount} kelas</span>
        <h3 className="mt-3 text-2xl leading-tight font-bold tracking-tight">{track.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-400">{track.description}</p>
        <span aria-hidden className="relative mt-6 flex items-center justify-between">
          <span className="absolute inset-x-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-800" />
          {Array.from({ length: dots }, (_, i) => (
            <span key={i} className={`relative size-3 rounded-full ring-4 ring-zinc-900 ${i === 0 ? "bg-brand" : "bg-zinc-700"}`} />
          ))}
        </span>
      </a>
    </li>
  );
}
