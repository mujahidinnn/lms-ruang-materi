import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import SiteHeader from "@/components/landing/SiteHeader";
import PracticeQuiz from "@/components/quiz/PracticeQuiz";
import { getPractice, getTopics } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

// Every published topic gets a page, so the build never depends on a topic
// having questions yet.
export async function generateStaticParams() {
  const topics = await getTopics();
  if (topics.length === 0) throw new Error("No published topics.");
  return topics.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(props: PageProps<"/latihan/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const practice = await getPractice(slug);
  if (!practice) return {};
  return {
    title: `Latihan ${practice.title}`,
    description: `Soal latihan ${practice.title} dengan pembahasan langsung di setiap jawaban. Tanpa batas waktu, boleh diulang.`,
    alternates: { canonical: `${SITE_URL}/latihan/${slug}` },
  };
}

export default function LatihanPage(props: PageProps<"/latihan/[slug]">) {
  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 px-5 pb-20 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <Suspense fallback={<p className="text-sm text-zinc-500">Memuat...</p>}>
            <Latihan params={props.params} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function Latihan({ params }: { params: PageProps<"/latihan/[slug]">["params"] }) {
  const { slug } = await params;
  const practice = await getPractice(slug);
  if (!practice) notFound();

  return (
    <>
      <Link href={`/belajar/${slug}`} className="text-sm text-zinc-400 hover:text-zinc-50">{practice.title}</Link>
      <h1 className="mt-2 mb-8 text-4xl font-bold tracking-tight sm:text-5xl">Latihan</h1>
      {practice.questions.length === 0 ? (
        <p className="text-zinc-400">
          Soal latihan untuk topik ini belum tersedia.{" "}
          <Link href={`/belajar/${slug}`} className="text-accent hover:underline">Kembali ke materi</Link>
        </p>
      ) : (
        <PracticeQuiz topicId={practice.id} slug={slug} questions={practice.questions} hasExam={practice.hasExam} />
      )}
    </>
  );
}
