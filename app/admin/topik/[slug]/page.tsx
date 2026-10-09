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

type Row = { id: string; status: string };

// When a table has drafts, those are what publish puts live, so show them;
// otherwise show the published rows.
const pending = <T extends Row>(rows: T[] | null) => {
  const all = rows ?? [];
  return all.some((r) => r.status === "draft") ? all.filter((r) => r.status === "draft") : all;
};

export default function TopikPage(props: PageProps<"/admin/topik/[slug]">) {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Memuat...</p>}>
      <Topik params={props.params} />
    </Suspense>
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

  const shownSlides = pending(slides.data);
  const shownTips = pending(tips.data);
  const shownCards = pending(cards.data);
  const shownPractice = pending(practice.data as Question[]);
  const shownExam = pending(exam.data?.exam_questions as Question[] | null);
  const prereq: string[] = job.data?.prerequisites ?? [];
  const hasDraft =
    !!topic.draft_summary ||
    [slides.data, tips.data, cards.data, practice.data, exam.data?.exam_questions as Row[] | undefined].some((rows) =>
      rows?.some((x) => x.status === "draft")
    );

  const sections = [
    { id: "ringkasan", title: "Ringkasan" },
    { id: "slide", title: "Slide", count: shownSlides.length },
    { id: "tips", title: "Tips", count: shownTips.length },
    { id: "flashcard", title: "Flashcard", count: shownCards.length },
    { id: "latihan", title: "Soal latihan", count: shownPractice.length },
    { id: "ujian", title: "Soal ujian", count: shownExam.length },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[17rem_1fr]">
      <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
        <div>
          <Link href="/admin/topik" className="text-sm text-zinc-400 hover:text-zinc-50">Semua topik</Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{topic.title}</h1>
          <p className="mt-1 font-mono text-sm text-zinc-500">{slug}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <StatusBadge status={topic.status} />
            {hasDraft && <span className="text-zinc-400">Ada draf baru</span>}
            {topic.status === "published" && <Link href={`/belajar/${slug}`} className="text-accent hover:underline">Lihat di situs</Link>}
          </div>
        </div>
        <TopicActions slug={slug} published={topic.status === "published"} hasDraft={hasDraft} />
        {prereq.length > 0 && (
          <p className="text-sm text-zinc-400">
            Saran prasyarat dari model: <span className="font-mono text-zinc-300">{prereq.join(", ")}</span>
          </p>
        )}
        <nav aria-label="Bagian topik" className="hidden lg:block">
          <ul className="border-l border-zinc-800/80 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px flex min-h-9 items-center justify-between border-l border-transparent pl-3 text-zinc-400 hover:border-accent hover:text-zinc-50">
                  {s.title}
                  {s.count !== undefined && <span className="tabular-nums text-zinc-500">{s.count}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col gap-12">
        <Section id="ringkasan" title="Ringkasan" note={topic.draft_summary ? "Draf, tampil setelah diterbitkan" : undefined}>
          <form action={simpanRingkasan} className="flex flex-col gap-3">
            <input type="hidden" name="slug" value={slug} />
            <textarea name="summary" aria-label="Ringkasan" defaultValue={topic.draft_summary ?? topic.summary} rows={10} required className={`${field} leading-relaxed`} />
            <button className={`${smallButton} w-fit`}>Simpan ringkasan</button>
          </form>
        </Section>

        <Section id="slide" title="Slide" note={`${shownSlides.length} slide${shownSlides[0]?.status === "draft" ? ", hasil render baru" : ""}`}>
          <ul className="scrollbar-thin flex gap-2 overflow-x-auto pb-2">
            {shownSlides.map((s) => (
              <li key={s.id} className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-md border border-zinc-800/80">
                <Image src={thumbSrc({ ...s, src: slideUrl(s.path) })} alt={`${topic.title}, slide ${s.index} dari ${shownSlides.length}`} fill sizes="144px" className="object-cover" />
              </li>
            ))}
          </ul>
        </Section>

        <Section id="tips" title="Tips">
          <List>{shownTips.map((r) => <RowEditor key={r.id} table="tips" slug={slug} row={r} fields={[{ name: "body", label: "Tip" }]} />)}</List>
        </Section>

        <Section id="flashcard" title="Flashcard">
          <List>
            {shownCards.map((r) => (
              <RowEditor key={r.id} table="flashcards" slug={slug} row={r} fields={[{ name: "front", label: "Depan" }, { name: "back", label: "Belakang" }]} />
            ))}
          </List>
        </Section>

        <Section id="latihan" title="Soal latihan" note="Langsung dapat pembahasan, tidak dinilai">
          <List>{shownPractice.map((q, i) => <QuestionEditor key={q.id} table="practice_questions" slug={slug} q={q} n={i + 1} />)}</List>
        </Section>

        <Section id="ujian" title="Soal ujian" note="Bank soal, tiap percobaan mengambil sebagian secara acak">
          <List>{shownExam.map((q, i) => <QuestionEditor key={q.id} table="exam_questions" slug={slug} q={q} n={i + 1} />)}</List>
        </Section>
      </div>
    </div>
  );
}

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-judul`} className="scroll-mt-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 border-b border-zinc-800/80 pb-2">
        <h2 id={`${id}-judul`} className="text-lg font-semibold">{title}</h2>
        {note && <p className="text-sm text-zinc-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function List({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-zinc-800/80">{children}</ul>;
}
