import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import FlashcardDeck, { type Card } from "@/components/flashcard/FlashcardDeck";
import AccountNav from "@/components/dashboard/AccountNav";
import { NothingDue } from "@/components/illustrations";
import SiteHeader from "@/components/landing/SiteHeader";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Flashcard",
  description: "Kartu yang jatuh tempo hari ini dari semua topik yang sudah kamu buka.",
  robots: { index: false },
};

export default function FlashcardPage() {
  return (
    <div className="relative">
      <SiteHeader />
      <main className="px-5 pb-20 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Flashcard</h1>
          <div className="mb-8 mt-5"><AccountNav current="/flashcard" /></div>
          <Suspense fallback={<p className="text-sm text-zinc-500">Memuat...</p>}>
            <Queue />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function Queue() {
  await requireUser("/flashcard");
  const { data, error } = await (await createClient()).rpc("flashcard_queue");
  if (error) throw new Error(`flashcard_queue: ${error.message}`);
  const cards = data as Card[];

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <NothingDue className="size-24" />
        <p className="mt-6 max-w-sm text-zinc-400">
          Belum ada kartu jatuh tempo. Buka <Link href="/roadmap" className="text-accent hover:underline">roadmap</Link> untuk mulai topik baru.
        </p>
      </div>
    );
  }

  return (
    <FlashcardDeck
      cards={cards}
      masukHref="/masuk?next=/flashcard"
      end={<p className="text-zinc-400">Kartu berikutnya muncul lagi sesuai jadwalnya.</p>}
    />
  );
}
