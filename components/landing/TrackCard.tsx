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

const SHOWN = 4;
const STEP_TONES = ["bg-matcha-100", "bg-matcha-200", "bg-matcha-300", "bg-matcha-50"];

// A track as its path: one dot per topic on a line, up to twelve.
export default function TrackCard({ track }: { track: TrackSummary }) {
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
        {/* The path itself: the first classes in order, each a sticker. */}
        <ol aria-label="Urutan kelas" className="mt-6 flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs font-bold text-noir">
          {track.steps.slice(0, SHOWN).map((title, i) => (
            <li key={title} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className="text-zinc-500">→</span>}
              <span className={`rounded-full border-2 border-noir px-2.5 py-1 ${STEP_TONES[i % STEP_TONES.length]} ${i % 2 ? "rotate-2" : "-rotate-2"}`}>{title}</span>
            </li>
          ))}
          {track.steps.length > SHOWN && <li className="rounded-full bg-zinc-800 px-2.5 py-1 text-zinc-300">+{track.steps.length - SHOWN} lagi</li>}
        </ol>
      </a>
    </li>
  );
}
