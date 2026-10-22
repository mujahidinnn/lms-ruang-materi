"use client";

import { Check, ChevronLeft, Clock, Layers, Presentation, Play } from "lucide-react";
import ArrowBadge from "@/components/ui/ArrowBadge";
import ClassPath from "./ClassPath";
import { chip, primaryButton, tile } from "@/components/ui/styles";
import { totalMinutes } from "@/lib/chapters";
import type { Topic } from "@/lib/content";
import { useChapterProgress } from "./useChapterProgress";

export default function CourseView({ topic }: { topic: Topic }) {
  const { chapters } = topic;
  const { signedIn, done, lastChapterId } = useChapterProgress(
    topic.id,
    chapters.map((c) => c.id),
  );
  const resume =
    chapters.find((c) => c.id === lastChapterId && !done.has(c.id)) ??
    chapters.find((c) => !done.has(c.id)) ??
    chapters[0];
  const started = done.size > 0 || lastChapterId !== null;

  return (
    <main className="flex-1 px-5 pb-20 sm:px-10">
      <div className="mx-auto max-w-7xl">
        <a href="/kelas" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-zinc-400 hover:text-zinc-50">
          <ChevronLeft aria-hidden className="size-4" />Semua kelas
        </a>
        <header className="mt-2 rounded-[32px] bg-tile-lavender p-6 sm:p-10">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            {topic.title}
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-300">{topic.description}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            <li className={`${chip} bg-zinc-900/70 tabular-nums`}>
              {chapters.length} bab
            </li>
            <li className={`${chip} bg-zinc-900/70 tabular-nums`}>
              <Clock aria-hidden className="size-3.5" />
              {totalMinutes(chapters)} menit
            </li>
            <li className={`${chip} bg-zinc-900/70 tabular-nums`}>
              {topic.slideCount} slide
            </li>
          </ul>
          <a
            href={`/belajar/${topic.slug}/${resume.slug}`}
            className={`${primaryButton} mt-7`}
          >
            <Play aria-hidden className="size-4" />
            {started ? `Lanjutkan: ${resume.title}` : "Mulai bab 1"}
          </a>
          <a
            href={`/belajar/${topic.slug}/slide`}
            className="mt-7 ml-2 inline-flex min-h-12 items-center gap-2 rounded-full bg-zinc-900 px-5 font-semibold shadow-soft hover:bg-zinc-800"
          >
            <Presentation aria-hidden className="size-4" />
            Versi slide
          </a>
        </header>

        {/* Wide screens: syllabus left, the closing steps beside it. */}
        <div className="mt-4 grid items-start gap-x-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Phones: the list sits on the page, each chapter its own card,
              instead of cards inside a card. */}
          <section aria-labelledby="silabus" className="sm:rounded-[28px] sm:bg-zinc-900 sm:p-8 sm:shadow-soft">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="silabus" className="text-2xl font-bold tracking-tight">
                Daftar bab
              </h2>
              {signedIn && (
                <p className="text-sm text-zinc-400 tabular-nums">
                  {done.size} dari {chapters.length} bab selesai
                </p>
              )}
            </div>
            {signedIn && (
              <div aria-hidden className="mt-3 h-2.5 rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${(done.size / chapters.length) * 100}%` }}
                />
              </div>
            )}
            <ol className="mt-5 space-y-2">
              {chapters.map((c, i) => (
                <li key={c.id}>
                  <a
                    href={`/belajar/${topic.slug}/${c.slug}`}
                    className="group flex min-h-16 items-center gap-4 rounded-2xl bg-zinc-900 py-2 pr-2 pl-3 shadow-soft hover:bg-zinc-800 sm:bg-zinc-800/50 sm:shadow-none"
                  >
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold ${done.has(c.id) ? "bg-tile-mint" : tile(i)}`}
                    >
                      {done.has(c.id) ? (
                        <Check aria-label="selesai" className="size-4" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{c.title}</span>
                      <span className="mt-1 flex flex-wrap gap-1.5 text-xs font-semibold tabular-nums">
                        <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-zinc-400">
                          {c.estMinutes} menit
                        </span>
                        <span className="rounded-full bg-matcha-100 px-2 py-0.5 text-noir">
                          Materi
                        </span>
                        {c.exerciseCount > 0 && (
                          <span className="rounded-full bg-matcha-200 px-2 py-0.5 text-noir">
                            Kode {c.exerciseCount}
                          </span>
                        )}
                        {c.quizCount > 0 && (
                          <span className="rounded-full bg-matcha-300 px-2 py-0.5 text-noir">
                            Kuis {c.quizCount}
                          </span>
                        )}
                      </span>
                    </span>
                    <ArrowBadge className="size-10" />
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <aside className="lg:sticky lg:top-6">
            <section aria-labelledby="jalur" className="mt-10 lg:mt-0">
              <h2 id="jalur" className="text-2xl font-bold tracking-tight">
                Menuju sertifikat
              </h2>
              <ClassPath topic={topic} signedIn={!!signedIn} />
            </section>

            <section aria-labelledby="pendukung" className="mt-10">
              <h2 id="pendukung" className="text-2xl font-bold tracking-tight">
                Materi tambahan
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {topic.cardCount > 0 && (
                  <Extra
                    href={`/flashcard/${topic.slug}`}
                    icon={<Layers aria-hidden className="size-5" />}
                    title="Flashcard"
                    text={`${topic.cardCount} kartu`}
                    color="bg-tile-sky"
                  />
                )}
                <Extra
                  href={`/belajar/${topic.slug}/slide`}
                  icon={<Presentation aria-hidden className="size-5" />}
                  title="Semua slide"
                  text={`${topic.slideCount} slide`}
                  color="bg-tile-sky"
                />
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Extra({
  href,
  icon,
  title,
  text,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  color: string;
}) {
  return (
    <li>
      <a
        href={href}
        className={`group flex items-center gap-4 rounded-[28px] p-5 ${color}`}
      >
        <span className="grid size-11 place-items-center rounded-full bg-zinc-900/70">
          {icon}
        </span>
        <span className="flex-1">
          <span className="block font-bold">{title}</span>
          <span className="text-sm text-zinc-300">{text}</span>
        </span>
        <ArrowBadge />
      </a>
    </li>
  );
}
