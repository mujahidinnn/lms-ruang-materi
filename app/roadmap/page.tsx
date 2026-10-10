import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/landing/SiteHeader";
import { getTracks } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Pilih jalur belajar: urutan topik dengan prasyarat yang disarankan, dari dasar sampai mahir.",
  alternates: { canonical: `${SITE_URL}/roadmap` },
};

export default async function RoadmapListPage() {
  const tracks = await getTracks();

  return (
    <div className="relative">
      <SiteHeader />
      <main className="px-6 pb-20 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Roadmap</h1>
          <p className="mt-2 text-zinc-400">Pilih satu jalur, lalu ikuti topiknya dari kiri ke kanan.</p>
          {tracks.length === 0 ? (
            <p className="mt-10 text-zinc-400">
              Belum ada roadmap. <Link href="/#materi" className="text-accent hover:underline">Pilih materi</Link> untuk mulai belajar.
            </p>
          ) : (
            <ul className="mt-10 divide-y divide-zinc-800/80 border-y border-zinc-800/80">
              {tracks.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/roadmap/${t.slug}`}
                    className="group flex min-h-20 items-center gap-6 py-4 focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-semibold group-hover:text-accent">{t.title}</span>
                      {t.description && <span className="mt-1 line-clamp-2 block text-sm text-zinc-400">{t.description}</span>}
                    </span>
                    <span className="text-sm text-zinc-500 tabular-nums">{t.nodeCount} topik</span>
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
