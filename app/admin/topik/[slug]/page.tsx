import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { simpanRingkasan } from "@/app/admin/topik/actions";
import QuestionEditor, { type Question } from "@/components/admin/QuestionEditor";
import RowEditor from "@/components/admin/RowEditor";
import StatusBadge from "@/components/admin/StatusBadge";
import TopicActions from "@/components/admin/TopicActions";
import { field, smallButton } from "@/components/admin/editor";
import { requireAdmin } from "@/lib/dal";
import { slideUrl, thumbSrc } from "@/lib/slides";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tinjau topik",
  description: "Tinjau, edit dan terbitkan draf materi.",
  robots: { index: false },
};

// Drafts first: they are what publish will put live.
const draftFirst = <T extends { status: string }>(rows: T[] | null) =>
  (rows ?? []).toSorted((a, b) => (a.status === b.status ? 0 : a.status === "draft" ? -1 : 1));

export default function TopikPage(props: PageProps<"/admin/topik/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-12">
      <Link href="/admin/topik" className="text-sm text-zinc-400 hover:text-zinc-50">&larr; Semua topik</Link>
      <Suspense fallback={<p className="text-sm text-zinc-500">Memuat...</p>}>
        <Topik params={props.params} />
      </Suspense>
    </main>
  );
}

async function Topik({ params }: { params: PageProps<"/admin/topik/[slug]">["params"] }) {
  const { slug } = await params;
  await requireAdmin(`/admin/topik/${slug}`);
  const db = await createClient();

  const { data: topic } = await db.from("topics").select("*").eq("slug", slug).maybeSingle();
  if (!topic) notFound();

  const by = (t: string) => db.from(t).select("*").eq("topic_id", topic.id);
  const [slides, tips, cards, practice, exam, job] = await Promise.all([
    by("slides").order("index"),
    by("tips").order("position"),
    by("flashcards").order("position"),
    by("practice_questions").order("created_at"),
    db.from("exams").select("id, exam_questions(*)").eq("topic_id", topic.id).maybeSingle(),
    db.from("import_jobs").select("prerequisites").eq("slug", slug).eq("status", "done").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const allSlides = slides.data ?? [];
  const shown = allSlides.some((s) => s.status === "draft") ? allSlides.filter((s) => s.status === "draft") : allSlides;
  const examQs = draftFirst(exam.data?.exam_questions as Question[] | null);
  const prereq: string[] = job.data?.prerequisites ?? [];

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{topic.title}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
            <StatusBadge status={topic.status} />
            <span>{slug}</span>
            {topic.status === "published" && <Link href={`/belajar/${slug}`} className="text-accent hover:underline">Lihat</Link>}
          </div>
          {prereq.length > 0 && <p className="mt-2 text-sm text-zinc-400">Saran prasyarat: {prereq.join(", ")}</p>}
        </div>
        <TopicActions slug={slug} published={topic.status === "published"} />
      </header>

      <Section title="Ringkasan" count={topic.draft_summary ? "ada draf" : ""} open>
        <form action={simpanRingkasan} className="flex flex-col gap-2">
          <input type="hidden" name="slug" value={slug} />
          <textarea name="summary" aria-label="Ringkasan" defaultValue={topic.draft_summary ?? topic.summary} rows={8} required className={field} />
          <button className={`${smallButton} w-fit`}>Simpan</button>
        </form>
      </Section>

      <Section title="Slide" count={`${shown.length}${shown[0]?.status === "draft" ? " draf" : ""}`}>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {shown.map((s) => (
            <div key={s.id} className="relative aspect-video overflow-hidden rounded-md border border-zinc-800/80">
              <Image src={thumbSrc({ ...s, src: slideUrl(s.path) })} alt={`${topic.title}, slide ${s.index} dari ${shown.length}`} fill sizes="160px" className="object-cover" />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tips" count={tips.data?.length}>
        {draftFirst(tips.data).map((r) => <RowEditor key={r.id} table="tips" slug={slug} row={r} fields={[{ name: "body", label: "Tip" }]} />)}
      </Section>

      <Section title="Flashcard" count={cards.data?.length}>
        {draftFirst(cards.data).map((r) => (
          <RowEditor key={r.id} table="flashcards" slug={slug} row={r} fields={[{ name: "front", label: "Depan" }, { name: "back", label: "Belakang" }]} />
        ))}
      </Section>

      <Section title="Soal latihan" count={practice.data?.length}>
        {draftFirst(practice.data as Question[]).map((q, i) => <QuestionEditor key={q.id} table="practice_questions" slug={slug} q={q} n={i + 1} />)}
      </Section>

      <Section title="Soal ujian" count={examQs.length}>
        {examQs.map((q, i) => <QuestionEditor key={q.id} table="exam_questions" slug={slug} q={q} n={i + 1} />)}
      </Section>
    </>
  );
}

function Section({ title, count, open, children }: { title: string; count?: number | string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group rounded-lg border border-zinc-800/80">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between px-4 font-medium">
        <h2>{title}</h2>
        <span className="text-sm text-zinc-500">{count}</span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-zinc-800/80 p-4">{children}</div>
    </details>
  );
}
