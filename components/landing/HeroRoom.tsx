import Image from "next/image";
import Link from "next/link";
import { coverSrc, type Presentation } from "@/lib/slides";

// The logo's room, drawn large: an open frame holding real covers. The one
// featured card of the landing page.
export default function HeroRoom({ topics }: { topics: Presentation[] }) {
  const [front, ...back] = topics.slice(0, 3);
  if (!front) return null;

  return (
    <Link
      href={`/belajar/${front.slug}`}
      className="group relative block rounded-2xl p-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:p-10"
    >
      {/* The room: tinted frame with its top right corner left open, as in
          the logo. Two mask layers union, so only that corner is cut. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl border border-accent/30 bg-accent/5 [mask-image:linear-gradient(to_left,transparent_4.5rem,black_4.5rem),linear-gradient(to_bottom,transparent_4.5rem,black_4.5rem)]"
      />

      {/* Stack sits low and left so the open corner stays empty. */}
      <div className="relative mt-6 mr-10 aspect-[4/3] max-w-md">
        {back.map((t, i) => (
          <div
            key={t.slug}
            className={`absolute inset-x-8 aspect-video overflow-hidden rounded-lg border border-zinc-800/80 ${
              i === 0 ? "top-0 translate-x-4 rotate-2" : "top-4 -translate-x-3 -rotate-2"
            }`}
          >
            <Image src={coverSrc(t)} alt="" fill sizes="400px" className="object-cover opacity-50" />
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 aspect-video overflow-hidden rounded-lg border border-zinc-800/80 transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none">
          <Image src={coverSrc(front)} alt={`Sampul materi ${front.title}`} fill sizes="(min-width: 1024px) 450px, 90vw" className="object-cover" priority />
        </div>
      </div>

      <p className="mt-6 flex items-baseline justify-between gap-4">
        <span>
          <span className="block text-sm text-accent">Mulai dari sini</span>
          <span className="text-lg font-semibold">{front.title}</span>
        </span>
        <span className="text-sm text-zinc-400 tabular-nums">{front.slideCount} slide</span>
      </p>
    </Link>
  );
}
