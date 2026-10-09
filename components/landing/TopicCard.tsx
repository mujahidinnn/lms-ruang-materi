import Image from "next/image";
import Link from "next/link";
import { coverSrc, type Presentation } from "@/lib/slides";

export default function TopicCard({ topic }: { topic: Presentation }) {
  return (
    <li>
      <Link
        href={`/belajar/${topic.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950 transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <div className="relative aspect-video border-b border-zinc-800/80">
          <Image src={coverSrc(topic)} alt={`Sampul materi ${topic.title}`} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="font-semibold tracking-tight group-hover:text-accent">{topic.title}</h3>
          <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-400">{topic.description}</p>
          <p className="text-xs text-zinc-500 tabular-nums">{topic.slideCount} slide</p>
        </div>
      </Link>
    </li>
  );
}
