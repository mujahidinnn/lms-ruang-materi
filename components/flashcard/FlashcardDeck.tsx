"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { nilaiKartu } from "@/app/flashcard/actions";
import { daysFor, nextBox, RATINGS, type Rating } from "@/lib/leitner";

export type Card = { id: string; front: string; back: string; topic?: string; box?: number | null };

// Space flips, 1 to 3 rate. Ratings are saved through review_flashcard();
// logged out the deck still flips and rates, it just keeps nothing.
// box is known only in the scheduled queue, so only there the buttons say
// when the card comes back.
export default function FlashcardDeck({ cards, masukHref, end }: { cards: Card[]; masukHref: string; end: ReactNode }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [note, setNote] = useState<ReactNode>(null);
  const [guestShown, setGuestShown] = useState(false);

  const card = cards[i];

  async function rate(rating: Rating) {
    if (!flipped) return;
    setI(i + 1);
    setFlipped(false);
    const res = await nilaiKartu(card.id, rating);
    if (res.guest && !guestShown) {
      setGuestShown(true);
      setNote(<Link href={masukHref} className="text-accent hover:underline">Masuk untuk menyimpan progres</Link>);
    } else if (res.error) {
      setNote(res.error);
    }
  }

  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (["1", "2", "3"].includes(e.key)) rate(Number(e.key) as Rating);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!card) {
    return (
      <div className="py-6">
        <p className="text-2xl font-semibold tracking-tight">{cards.length} kartu selesai</p>
        <p aria-live="polite" className="mt-2 text-sm text-zinc-400">{note}</p>
        <div className="mt-6">{end}</div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="group relative block aspect-[3/2] w-full [perspective:1200px] focus-visible:outline-none sm:aspect-[2/1]"
      >
        <span
          className={`relative block size-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
        >
          <Face label={card.topic ?? "Depan"} text={card.front} hidden={flipped} />
          <Face label="Belakang" text={card.back} hidden={!flipped} back />
        </span>
      </button>

      <div className="mt-6 flex min-h-12 flex-wrap items-center gap-2">
        {flipped ? (
          RATINGS.map(({ rating, label }) => (
            <button
              key={rating}
              onClick={() => rate(rating)}
              className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-4 font-medium focus-visible:outline-2 focus-visible:outline-accent ${
                rating === 3 ? "border-accent bg-accent text-zinc-950 hover:opacity-90" : "border-zinc-800 hover:border-zinc-600"
              }`}
            >
              <span className="font-mono text-xs opacity-60">{rating}</span>
              {label}
              {card.box !== undefined && (
                <span className="text-xs font-normal opacity-60">{daysFor(nextBox(card.box, rating))} hari</span>
              )}
            </button>
          ))
        ) : (
          <button
            onClick={() => setFlipped(true)}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-800 font-medium hover:border-zinc-600 focus-visible:outline-2 focus-visible:outline-accent"
          >
            Balik kartu <span className="font-mono text-xs text-zinc-500">Space</span>
          </button>
        )}
      </div>

      <p className="mt-4 flex justify-between gap-4 text-sm text-zinc-500">
        <span aria-live="polite">{note}</span>
        <span className="shrink-0 tabular-nums">{cards.length - i} kartu tersisa</span>
      </p>
    </div>
  );
}

function Face({ label, text, hidden, back = false }: { label: string; text: string; hidden: boolean; back?: boolean }) {
  return (
    <span
      aria-hidden={hidden}
      className={`absolute inset-0 flex flex-col rounded-2xl border p-6 text-left [backface-visibility:hidden] sm:p-10 ${
        back ? "[transform:rotateY(180deg)] border-accent/40 bg-zinc-900" : "border-zinc-800 bg-zinc-900/60 group-hover:border-zinc-700"
      }`}
    >
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`m-auto text-center text-balance ${back ? "text-lg leading-relaxed text-zinc-200" : "text-2xl font-semibold tracking-tight sm:text-3xl"}`}>
        {text}
      </span>
    </span>
  );
}
