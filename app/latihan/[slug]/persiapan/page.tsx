import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import SiteHeader from "@/components/landing/SiteHeader";
import PracticeQuiz from "@/components/quiz/PracticeQuiz";
import PracticeTabs from "@/components/quiz/PracticeTabs";
import { getPractice, getTopics } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

const SIZE = 20;

export async function generateStaticParams() {
  return (await getTopics()).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(props: PageProps<"/latihan/[slug]/persiapan">): Promise<Metadata> {
  const { slug } = await props.params;
  const practice = await getPractice(slug);
  if (!practice) return {};
  return {
    title: `Simulasi ujian ${practice.title}`,
    description: `${SIZE} soal acak ${practice.title} dengan kunci dan pembahasan langsung, dinilai seperti ujian.`,
    alternates: { canonical: `${SITE_URL}/latihan/${slug}/persiapan` },
  };
}

export default function PersiapanPage(props: PageProps<"/latihan/[slug]/persiapan">) {
  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 px-5 pb-20 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <Suspense fallback={<p className="text-sm text-zinc-500">Memuat...</p>}>
            <Persiapan params={props.params} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function Persiapan({ params }: { params: PageProps<"/latihan/[slug]/persiapan">["params"] }) {
  const { slug } = await params;
  const practice = await getPractice(slug);
  if (!practice) notFound();
  const pool = [...practice.questions, ...practice.chapterQuestions];

  return (
    <>
      <Link href={`/belajar/${slug}`} className="text-sm text-zinc-400 hover:text-zinc-50">{practice.title}</Link>
      <h1 className="mt-2 mb-5 text-4xl font-bold tracking-tight sm:text-5xl">Simulasi ujian</h1>
      <PracticeTabs slug={slug} current="persiapan" />
      {pool.length === 0 ? (
        <p className="text-zinc-400">
          Soal untuk simulasi belum tersedia.{" "}
          <Link href={`/belajar/${slug}`} className="text-accent hover:underline">Kembali ke materi</Link>
        </p>
      ) : (
        <PracticeQuiz topicId={practice.id} slug={slug} questions={pool} hasExam={practice.hasExam} prep={{ passScore: practice.passScore ?? 70, size: SIZE }} />
      )}
    </>
  );
}
