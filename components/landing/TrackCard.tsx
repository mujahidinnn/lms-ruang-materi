import { TrackIcon } from "@/components/ui/icons";
import ArrowBadge from "@/components/ui/ArrowBadge";
import { card, mutedChip } from "@/components/ui/styles";
import type { TrackSummary } from "@/lib/content";

const SHOWN = 3;
const STEP_TONES = ["bg-matcha-100", "bg-matcha-200", "bg-matcha-300", "bg-matcha-50"];

// A track as its path: one dot per topic on a line, up to twelve.
export default function TrackCard({ track }: { track: TrackSummary }) {
  return (
    <li>
      <a
        href={`/roadmap/${track.slug}`}
        className={`group flex h-full flex-col p-5 transition-transform sm:p-6 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none ${card}`}
      >
        <div className="flex items-center gap-3">
          <span className="grid size-11 -rotate-6 place-items-center rounded-2xl sm:size-14 sm:rounded-[20px] border-2 border-noir bg-matcha-200 text-noir shadow-[3px_3px_0_0_var(--color-noir)] transition-transform group-hover:rotate-0">
            <TrackIcon slug={track.slug} className="size-7 sm:size-9" />
          </span>
          <span className={`${mutedChip} tabular-nums`}>{track.nodeCount} kelas</span>
          <span className="ml-auto"><ArrowBadge /></span>
        </div>
        <h3 className="mt-3 text-xl sm:text-2xl leading-tight font-bold tracking-tight">{track.title}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm sm:mt-2 leading-relaxed text-zinc-400">{track.description}</p>
        {/* The path itself: the first classes in order. */}
        <ol aria-label="Urutan kelas" className="mt-4 space-y-1.5 border-t border-zinc-800 pt-3 sm:mt-6 sm:space-y-2 sm:pt-4 text-sm font-semibold text-zinc-50">
          {track.steps.slice(0, SHOWN).map((title, i) => (
            <li key={title} className="flex items-center gap-2.5">
              <span aria-hidden className={`grid size-6 shrink-0 place-items-center rounded-full border-2 border-noir text-[11px] text-noir tabular-nums ${STEP_TONES[i % STEP_TONES.length]}`}>{i + 1}</span>
              <span className="truncate">{title}</span>
            </li>
          ))}
          {track.steps.length > SHOWN && <li className="pl-[34px] text-xs font-medium text-zinc-400">+{track.steps.length - SHOWN} kelas lagi</li>}
        </ol>
      </a>
    </li>
  );
}
