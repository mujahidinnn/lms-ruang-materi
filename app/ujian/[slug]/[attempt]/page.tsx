import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import ExamReview, { type Review } from "@/components/exam/ExamReview";
import ExamRunner, { type ExamQuestion } from "@/components/exam/ExamRunner";
import { requireUser } from "@/lib/dal";
import { secondsLeft, timedOut } from "@/lib/exam";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ujian",
  description: "Kerjakan ujian atau lihat pembahasan percobaanmu.",
  robots: { index: false },
};

// No site header while an exam runs: fewer ways to leave by accident.
export default function AttemptPage(props: PageProps<"/ujian/[slug]/[attempt]">) {
  return (
    <main className="flex-1 px-5 pt-0 pb-20 sm:px-10">
      <div className="mx-auto max-w-2xl">
        <Suspense fallback={<p className="pt-10 text-sm text-zinc-500">Memuat...</p>}>
          <Attempt params={props.params} />
        </Suspense>
      </div>
    </main>
  );
}

async function Attempt({ params }: { params: PageProps<"/ujian/[slug]/[attempt]">["params"] }) {
  const { slug, attempt } = await params;
  await requireUser(`/ujian/${slug}/${attempt}`);
  await connection();
  if (!/^[0-9a-f-]{36}$/.test(attempt)) notFound();
  const db = await createClient();

  const { data: a } = await db.from("exam_attempts").select("id, deadline, submitted_at").eq("id", attempt).maybeSingle();
  if (!a) notFound();

  const back = <Link href={`/ujian/${slug}`} className="text-sm text-zinc-400 hover:text-zinc-50">Kembali ke ujian</Link>;

  if (a.submitted_at) {
    const { data } = await db.rpc("exam_attempt_review", { p_attempt: a.id });
    return (
      <div className="pt-10">
        {back}
        <h1 className="sr-only">Hasil ujian</h1>
        <div className="mt-6"><ExamReview review={data as Review} slug={slug} /></div>
      </div>
    );
  }

  if (timedOut(a.deadline)) {
    return (
      <div className="pt-10">
        {back}
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Waktu habis</h1>
        <p className="mt-2 text-zinc-400">Jawaban percobaan ini tidak sempat terkumpul, jadi tidak dinilai. Percobaan ini tetap terhitung.</p>
      </div>
    );
  }

  const { data: questions } = await db.rpc("exam_attempt_questions", { p_attempt: a.id });
  return (
    <>
      <h1 className="sr-only">Ujian</h1>
      <ExamRunner attemptId={a.id} secondsLeft={secondsLeft(a.deadline)} questions={questions as ExamQuestion[]} />
    </>
  );
}
