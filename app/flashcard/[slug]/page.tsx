import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import FlashcardDeck from "@/components/flashcard/FlashcardDeck";
import SiteHeader from "@/components/landing/SiteHeader";
import { getDeck, getTopics } from "@/lib/content";

export async function generateStaticParams() {
  const topics = await getTopics();
  if (topics.length === 0) throw new Error("No published topics.");
  return topics.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(props: PageProps<"/flashcard/[slug]">): Promise<Metadata> {
  const deck = await getDeck((await props.params).slug);
  if (!deck) return {};
  return {
    title: `Flashcard ${deck.title}`,
    description: `Kartu hafalan ${deck.title}: balik kartunya, lalu nilai seberapa ingat kamu.`,
    robots: { index: false },
  };
}

export default function DeckPage(props: PageProps<"/flashcard/[slug]">) {
  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 px-5 pb-20 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <Suspense fallback={<p className="text-sm text-zinc-500">Memuat...</p>}>
            <Deck params={props.params} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function Deck({ params }: { params: PageProps<"/flashcard/[slug]">["params"] }) {
  const { slug } = await params;
  const deck = await getDeck(slug);
  if (!deck) notFound();

  return (
    <>
      <Link href={`/belajar/${slug}`} className="text-sm text-zinc-400 hover:text-zinc-50">{deck.title}</Link>
      <h1 className="mt-2 mb-8 text-4xl font-bold tracking-tight">Flashcard</h1>
      {deck.cards.length === 0 ? (
        <p className="text-zinc-400">
          Flashcard untuk topik ini belum tersedia.{" "}
          <Link href={`/belajar/${slug}`} className="text-accent hover:underline">Kembali ke materi</Link>
        </p>
      ) : (
        <FlashcardDeck
          cards={deck.cards}
          masukHref={`/masuk?next=/flashcard/${slug}`}
          end={<Link href="/flashcard" className="text-accent hover:underline">Lihat semua kartu jatuh tempo</Link>}
        />
      )}
    </>
  );
}
