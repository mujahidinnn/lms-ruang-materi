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
        className={`group flex h-full flex-col gap-4 rounded-[28px] p-5 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none ${tile(index)}`}
      >
        <div className="flex items-start justify-between gap-3">
          <span className={`${chip} bg-zinc-900/70 tabular-nums`}>{n ? `${n} bab · ${totalMinutes(topic.chapters)} menit` : `${topic.slideCount} slide`}</span>
          <ArrowBadge />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl leading-tight font-bold tracking-tight text-balance">{topic.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-300">{topic.description}</p>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-2xl">
          <img src={coverSrc(topic)} alt={`Sampul materi ${topic.title}`} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
        </div>
      </a>
    </li>
  );
}
