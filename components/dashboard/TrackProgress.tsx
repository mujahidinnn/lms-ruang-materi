import Link from "next/link";
import { levelFor, nextLevel } from "@/lib/level";

// "5 dari 12" in text with a thin bar that only repeats it.
export default function TrackProgress({ slug, title, passed, total }: { slug: string; title: string; passed: number; total: number }) {
  const next = nextLevel(passed, total);
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Link href={`/roadmap/${slug}`} className="font-medium hover:text-accent">{title}</Link>
        <span className="text-sm text-zinc-400 tabular-nums">
          <span className="text-zinc-50">{levelFor(passed, total)}</span>, {passed} dari {total} topik lulus
        </span>
      </div>
      <div aria-hidden className="mt-2 h-1.5 rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-accent" style={{ width: `${total ? (passed / total) * 100 : 0}%` }} />
      </div>
      {next && <p className="mt-1.5 text-xs text-zinc-500">{next.name} butuh {next.topics} topik lagi</p>}
    </>
  );
}
