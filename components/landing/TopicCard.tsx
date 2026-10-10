import Image from "next/image";
import Link from "next/link";
import ArrowBadge from "@/components/ui/ArrowBadge";
import { chip, tile } from "@/components/ui/styles";
import { coverSrc, type Presentation } from "@/lib/slides";

// A topic as a pastel tile; the hue comes from its place in the list.
export default function TopicCard({ topic, index }: { topic: Presentation; index: number }) {
  return (
    <li>
      <Link
        href={`/belajar/${topic.slug}`}
        className={`group flex h-full flex-col gap-4 rounded-[28px] p-5 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none ${tile(index)}`}
      >
        <div className="flex items-start justify-between gap-3">
          <span className={`${chip} bg-zinc-900/70 tabular-nums`}>{topic.slideCount} slide</span>
          <ArrowBadge />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl leading-tight font-bold tracking-tight text-balance">{topic.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-300">{topic.description}</p>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-2xl">
          <Image src={coverSrc(topic)} alt={`Sampul materi ${topic.title}`} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        </div>
      </Link>
    </li>
  );
}
