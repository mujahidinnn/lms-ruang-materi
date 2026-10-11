import { ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ChapterMarkdown from "@/components/belajar/markdown";
import ChapterQuiz from "@/components/belajar/ChapterQuiz";
import ChapterSyllabus from "@/components/belajar/ChapterSyllabus";
import SiteHeader from "@/components/landing/SiteHeader";
import { primaryButton, secondaryButton } from "@/components/ui/styles";
import { neighbors } from "@/lib/chapters";
import { getChapter, getTopic, getTopics } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

// cacheComponents rejects an empty list; before any topic has chapters the
// placeholder renders notFound().
export async function generateStaticParams() {
  const topics = await getTopics();
  const params = topics.flatMap((t) => t.chapters.map((c) => ({ slug: t.slug, bab: c.slug })));
  return params.length ? params : [{ slug: topics[0]?.slug ?? "x", bab: "_" }];
}

export async function generateMetadata(props: PageProps<"/belajar/[slug]/[bab]">): Promise<Metadata> {
  const { slug, bab } = await props.params;
  const [topic, chapter] = await Promise.all([getTopic(slug), getChapter(slug, bab)]);
  if (!topic || !chapter) return {};
  return {
    title: `${chapter.title} · ${topic.title}`,
    description: chapter.body.replace(/[#*`>!\[\]()]/g, "").slice(0, 155),
    alternates: { canonical: `${SITE_URL}/belajar/${slug}/${bab}` },
  };
}

export default async function ChapterPage(props: PageProps<"/belajar/[slug]/[bab]">) {
  const { slug, bab } = await props.params;
  const [topic, chapter] = await Promise.all([getTopic(slug), getChapter(slug, bab)]);
  if (!topic || !chapter) notFound();
  const { prev, next } = neighbors(topic.chapters, bab);
  const index = topic.chapters.findIndex((c) => c.slug === bab);

  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 px-5 pb-20 sm:px-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="lg:pt-4">
            <Link href={`/belajar/${slug}`} className="text-sm text-zinc-400 hover:text-zinc-50">{topic.title}</Link>
            <div className="mt-3"><ChapterSyllabus topicId={topic.id} topicSlug={slug} chapters={topic.chapters} current={bab} /></div>
          </aside>
          <article className="min-w-0 lg:pt-4">
            <p className="text-sm text-zinc-400 tabular-nums">Bab {index + 1} dari {topic.chapters.length} · {chapter.estMinutes} menit</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-balance sm:text-5xl">{chapter.title}</h1>
            <div className="mt-8"><ChapterMarkdown body={chapter.body} slides={topic.slides} /></div>
            <ChapterQuiz
              chapterId={chapter.id}
              slug={slug}
              questions={chapter.questions}
              exercises={chapter.exercises}
              prompts={chapter.exercises.map((ex) => <ChapterMarkdown key={ex.id} body={ex.prompt} slides={topic.slides} />)}
            />
            <nav aria-label="Bab lain" className="mt-8 flex flex-wrap justify-between gap-3">
              {prev ? <Link href={`/belajar/${slug}/${prev.slug}`} className={secondaryButton}><ChevronLeft aria-hidden className="size-4" />{prev.title}</Link> : <span />}
              {next ? (
                <Link href={`/belajar/${slug}/${next.slug}`} className={primaryButton}>{next.title}<ChevronRight aria-hidden className="size-4" /></Link>
              ) : topic.practiceCount > 0 ? (
                <Link href={`/latihan/${slug}`} className={primaryButton}><ListChecks aria-hidden className="size-4" />Lanjut ke latihan akhir</Link>
              ) : (
                <Link href={`/belajar/${slug}`} className={primaryButton}>Kembali ke silabus</Link>
              )}
            </nav>
          </article>
        </div>
      </main>
    </div>
  );
}
