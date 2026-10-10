import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/landing/SiteHeader";
import { getTracks } from "@/lib/content";
import ArrowBadge from "@/components/ui/ArrowBadge";
import { chip, tile } from "@/components/ui/styles";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Pilih jalur belajar: urutan topik dengan prasyarat yang disarankan, dari dasar sampai mahir.",
  alternates: { canonical: `${SITE_URL}/roadmap` },
};

export default async function RoadmapListPage() {
  const tracks = await getTracks();

  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 px-5 pb-20 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Roadmap</h1>
          <p className="mt-2 text-zinc-400">Pilih satu jalur, lalu ikuti topiknya dari kiri ke kanan.</p>
          {tracks.length === 0 ? (
            <p className="mt-10 text-zinc-400">
              Belum ada roadmap. <Link href="/#materi" className="text-accent hover:underline">Pilih materi</Link> untuk mulai belajar.
            </p>
          ) : (
            <ul className="mt-8 grid gap-4">
              {tracks.map((t, i) => (
                <li key={t.slug}>
                  <Link
                    href={`/roadmap/${t.slug}`}
                    className={`group flex min-h-28 items-center gap-5 rounded-[28px] p-6 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none ${tile(i)}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-2xl font-bold tracking-tight">{t.title}</span>
                      {t.description && <span className="mt-1 line-clamp-2 block text-sm text-zinc-300">{t.description}</span>}
                    </span>
                    <span className={`${chip} hidden bg-zinc-900/70 tabular-nums sm:inline-flex`}>{t.nodeCount} topik</span>
                    <ArrowBadge />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
