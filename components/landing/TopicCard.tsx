import ArrowBadge from "@/components/ui/ArrowBadge";
import { chip, tile } from "@/components/ui/styles";
import { totalMinutes } from "@/lib/chapters";
import type { Topic } from "@/lib/content";
import { coverSrc } from "@/lib/slides";

type CardTopic = Pick<Topic, "slug" | "title" | "description" | "slideCount" | "slides" | "chapters">;

// A topic as a tile; the hue comes from its place in the list. A class with
// chapters shows its chapters and minutes, a slides-only topic its slides.
export default function TopicCard({ topic, index }: { topic: CardTopic; index: number }) {
  const n = topic.chapters.length;
  return (
    <li>
      <a
        href={`/belajar/${topic.slug}`}
        className={`group grid h-full grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-x-3 gap-y-2 rounded-[18px] p-4 sm:flex sm:flex-col sm:items-stretch sm:gap-4 sm:rounded-[18px] sm:p-5 sm:transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none ${tile(index)}`}
      >
        <div className="col-start-1 flex items-start justify-between gap-3 self-end sm:self-auto">
          <span className={`${chip} bg-zinc-900/70 tabular-nums`}>{n ? `${n} bab · ${totalMinutes(topic.chapters)} menit` : `${topic.slideCount} slide`}</span>
          <span className="hidden sm:block"><ArrowBadge /></span>
        </div>
        <div className="col-start-1 flex-1 self-start sm:self-auto">
          <h3 className="text-lg sm:text-2xl leading-tight font-bold tracking-tight text-balance">{topic.title}</h3>
          <p className="mt-1 line-clamp-2 sm:mt-2 text-sm leading-relaxed text-zinc-200">{topic.description}</p>
        </div>
        <div className="relative col-start-2 row-span-2 row-start-1 aspect-square overflow-hidden rounded-2xl sm:aspect-video">
          <img src={coverSrc(topic)} alt={`Sampul materi ${topic.title}`} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
        </div>
      </a>
    </li>
  );
}
