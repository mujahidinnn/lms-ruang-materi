"use client";

import { Check, ListOrdered, X } from "lucide-react";
import { useState } from "react";
import type { ChapterSummary } from "@/lib/content";
import { useChapterProgress } from "./useChapterProgress";

// variant "sidebar": the sticky list beside the article (lg and up).
// variant "button": a button that opens the same list as a bottom sheet,
// for the reader's bottom bar on phones.
export default function ChapterSyllabus({ topicId, topicSlug, chapters, current, variant = "sidebar" }: { topicId: string; topicSlug: string; chapters: ChapterSummary[]; current: string; variant?: "sidebar" | "button" }) {
  const { done } = useChapterProgress(topicId, chapters.map((c) => c.id));
  const [open, setOpen] = useState(false);
  const list = (
    <ol className="space-y-1">
      {chapters.map((c, i) => (
        <li key={c.id}>
          <a
            href={`/belajar/${topicSlug}/${c.slug}`}
            aria-current={c.slug === current ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm ${c.slug === current ? "bg-primary text-on-primary" : "text-zinc-300 hover:bg-zinc-800"}`}
          >
            <span className="w-5 shrink-0 text-center tabular-nums">{done.has(c.id) ? <Check aria-label="selesai" className="size-4" /> : i + 1}</span>
            <span className="line-clamp-2">{c.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
  return (
    <>
      {variant === "sidebar" ? (
        <nav aria-label="Daftar bab" className="scrollbar-thin sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-[28px] bg-zinc-900 p-3 shadow-soft">{list}</nav>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-noir bg-matcha-100 px-4 text-sm font-bold text-noir">
          <ListOrdered aria-hidden className="size-4" /> Bab {chapters.findIndex((c) => c.slug === current) + 1}/{chapters.length}
        </button>
      )}
      {open && (
        <>
          <div aria-hidden className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Daftar bab" className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-[32px] bg-zinc-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-soft lg:hidden">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg font-bold">Daftar bab</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup" className="grid size-11 place-items-center rounded-full bg-zinc-800"><X aria-hidden className="size-5" /></button>
            </div>
            {list}
          </div>
        </>
      )}
    </>
  );
}
