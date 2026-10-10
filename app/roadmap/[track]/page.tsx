import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import SiteHeader from "@/components/landing/SiteHeader";
import RoadmapView from "@/components/roadmap/RoadmapView";
import { getTrack, getTracks } from "@/lib/content";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

export async function generateStaticParams() {
  const tracks = await getTracks();
  if (tracks.length === 0) {
    throw new Error("No published tracks. The build needs at least one published track (build one in /admin/roadmap).");
  }
  return tracks.map((t) => ({ track: t.slug }));
}

export async function generateMetadata(props: PageProps<"/roadmap/[track]">): Promise<Metadata> {
  const track = await getTrack((await props.params).track);
  if (!track) return {};

  const url = `${SITE_URL}/roadmap/${track.slug}`;
  const description = track.description || `Urutan topik ${track.title}, dari dasar sampai mahir.`;
  return {
    title: track.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${track.title} · ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      images: [SITE_OG_IMAGE],
    },
  };
}

export default function TrackPage(props: PageProps<"/roadmap/[track]">) {
  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 px-5 pb-20 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <Link href="/roadmap" className="text-sm text-zinc-400 hover:text-zinc-50">
            Semua roadmap
          </Link>
          {/* Tracks published after the build render here on request. */}
          <Suspense fallback={<p className="mt-3 text-sm text-zinc-500">Memuat...</p>}>
            <Track params={props.params} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function Track({ params }: { params: PageProps<"/roadmap/[track]">["params"] }) {
  const track = await getTrack((await params).track);
  if (!track) notFound();

  return (
    <>
      <div className="mt-3 mb-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{track.title}</h1>
        <p className="inline-flex min-h-8 items-center rounded-full bg-tile-lavender px-3 text-xs font-medium tabular-nums">{track.nodes.length} topik</p>
      </div>
      {track.description && <p className="-mt-6 mb-10 max-w-2xl text-zinc-400">{track.description}</p>}
      <RoadmapView nodes={track.nodes} edges={track.edges} />
    </>
  );
}
