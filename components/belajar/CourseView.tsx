"use client";

import { Check, Clock, Layers, ListChecks, ClipboardCheck, Presentation, Play, Target } from "lucide-react";
import Link from "next/link";
import ArrowBadge from "@/components/ui/ArrowBadge";
import { card, chip, primaryButton, tile } from "@/components/ui/styles";
import { totalMinutes } from "@/lib/chapters";
import type { Topic } from "@/lib/content";
import { useChapterProgress } from "./useChapterProgress";

export default function CourseView({ topic }: { topic: Topic }) {
  const { chapters } = topic;
  const { signedIn, done, lastChapterId } = useChapterProgress(topic.id, chapters.map((c) => c.id));
  const resume = chapters.find((c) => c.id === lastChapterId && !done.has(c.id)) ?? chapters.find((c) => !done.has(c.id)) ?? chapters[0];
  const started = done.size > 0 || lastChapterId !== null;

  return (
    <main className="flex-1 px-5 pb-20 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="mt-4 rounded-[32px] bg-tile-lavender p-6 sm:p-10">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">{topic.title}</h1>
          <p className="mt-3 max-w-2xl text-zinc-300">{topic.description}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            <li className={`${chip} bg-zinc-900/70 tabular-nums`}>{chapters.length} bab</li>
            <li className={`${chip} bg-zinc-900/70 tabular-nums`}><Clock aria-hidden className="size-3.5" />{totalMinutes(chapters)} menit</li>
            <li className={`${chip} bg-zinc-900/70 tabular-nums`}>{topic.slideCount} slide</li>
          </ul>
          <Link href={`/belajar/${topic.slug}/${resume.slug}`} className={`${primaryButton} mt-7`}>
            <Play aria-hidden className="size-4" />
            {started ? `Lanjutkan: ${resume.title}` : "Mulai bab 1"}
          </Link>
        </header>

        <section aria-labelledby="silabus" className={`mt-4 p-6 sm:p-8 ${card}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="silabus" className="text-2xl font-bold tracking-tight">Silabus</h2>
            {signedIn && <p className="text-sm text-zinc-400 tabular-nums">{done.size} dari {chapters.length} bab selesai</p>}
          </div>
          {signedIn && (
            <div aria-hidden className="mt-3 h-2.5 rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-brand" style={{ width: `${(done.size / chapters.length) * 100}%` }} />
            </div>
          )}
          <ol className="mt-5 space-y-2">
            {chapters.map((c, i) => (
              <li key={c.id}>
                <Link href={`/belajar/${topic.slug}/${c.slug}`} className="group flex min-h-16 items-center gap-4 rounded-2xl bg-zinc-800/50 py-2 pr-2 pl-3 hover:bg-zinc-800">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold ${done.has(c.id) ? "bg-tile-mint" : tile(i)}`}>
                    {done.has(c.id) ? <Check aria-label="selesai" className="size-4" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{c.title}</span>
                    <span className="text-sm text-zinc-400 tabular-nums">{c.estMinutes} menit</span>
                  </span>
                  <ArrowBadge className="size-10" />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {topic.practiceCount > 0 && <Extra href={`/latihan/${topic.slug}`} icon={<ListChecks aria-hidden className="size-5" />} title="Latihan akhir" text={`${topic.practiceCount} soal dengan pembahasan`} color="bg-tile-mint" />}
          {topic.cardCount > 0 && <Extra href={`/flashcard/${topic.slug}`} icon={<Layers aria-hidden className="size-5" />} title="Flashcard" text={`${topic.cardCount} kartu`} color="bg-tile-butter" />}
          {topic.hasExam && <Extra href={`/latihan/${topic.slug}/persiapan`} icon={<Target aria-hidden className="size-5" />} title="Simulasi ujian" text="20 soal acak, kunci langsung terlihat" color="bg-tile-peach" />}
          {topic.hasExam && <Extra href={`/ujian/${topic.slug}`} icon={<ClipboardCheck aria-hidden className="size-5" />} title="Ujian akhir" text="Lulus untuk naik level" color="bg-tile-pink" />}
          <Extra href={`/belajar/${topic.slug}/slide`} icon={<Presentation aria-hidden className="size-5" />} title="Semua slide" text={`${topic.slideCount} slide`} color="bg-tile-sky" />
        </ul>
      </div>
    </main>
  );
}

function Extra({ href, icon, title, text, color }: { href: string; icon: React.ReactNode; title: string; text: string; color: string }) {
  return (
    <li>
      <Link href={href} className={`group flex items-center gap-4 rounded-[28px] p-5 ${color}`}>
        <span className="grid size-11 place-items-center rounded-full bg-zinc-900/70">{icon}</span>
        <span className="flex-1"><span className="block font-bold">{title}</span><span className="text-sm text-zinc-300">{text}</span></span>
        <ArrowBadge />
      </Link>
    </li>
  );
}
