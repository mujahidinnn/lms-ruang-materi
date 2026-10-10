import { Play } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import StartExam from "@/components/exam/StartExam";
import SiteHeader from "@/components/landing/SiteHeader";
import { requireUser } from "@/lib/dal";
import { standing, type AttemptRow } from "@/lib/exam";
import { card, chip, primaryButton, tile } from "@/components/ui/styles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ujian",
  description: "Ujian bertimer dengan nilai dari server. Lulus menandai topik selesai di roadmap.",
  robots: { index: false },
};

export default function UjianPage(props: PageProps<"/ujian/[slug]">) {
  return (
    <div className="relative">
      <SiteHeader />
      <main className="px-5 pb-20 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <Suspense fallback={<p className="text-sm text-zinc-500">Memuat...</p>}>
            <Intro params={props.params} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

type ExamRow = { id: string; duration_minutes: number; max_attempts: number; pass_score: number; question_count: number };

const time = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

async function Intro({ params }: { params: PageProps<"/ujian/[slug]">["params"] }) {
  const { slug } = await params;
  await requireUser(`/ujian/${slug}`);
  await connection();
  const db = await createClient();

  const { data: topic } = await db
    .from("topics")
    .select("title, exams(id, duration_minutes, max_attempts, pass_score, question_count)")
    .eq("slug", slug)
    .maybeSingle();
  // exams.topic_id is unique, so PostgREST embeds one object, not a list.
  const e = topic?.exams as unknown as ExamRow | null;
  if (!topic || !e) notFound();

  const { data: attempts } = await db
    .from("exam_attempts")
    .select("id, deadline, submitted_at, score, passed")
    .eq("exam_id", e.id)
    .order("created_at");
  const s = standing((attempts ?? []) as AttemptRow[], e.max_attempts, new Date());
  const last = attempts?.findLast((a) => a.submitted_at);

  return (
    <>
      <Link href={`/belajar/${slug}`} className="text-sm text-zinc-400 hover:text-zinc-50">{topic.title}</Link>
      <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Ujian</h1>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Soal", e.question_count],
          ["Waktu", `${e.duration_minutes} menit`],
          ["Nilai lulus", e.pass_score],
          ["Sisa percobaan", s.passed ? "-" : `${s.left} dari ${e.max_attempts}`],
        ].map(([k, v], n) => (
          <div key={k} className={`rounded-3xl p-4 ${tile(n)}`}>
            <dt className="text-xs font-medium text-zinc-300">{k}</dt>
            <dd className="mt-1 text-xl font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        {s.passed ? (
          <p className="text-zinc-300">
            Kamu sudah lulus dengan nilai terbaik <span className="font-semibold tabular-nums">{s.best}</span>.{" "}
            {last && <Link href={`/ujian/${slug}/${last.id}`} className="text-accent hover:underline">Lihat pembahasan</Link>}
          </p>
        ) : s.openId ? (
          <Link href={`/ujian/${slug}/${s.openId}`} className={primaryButton}>
            <Play aria-hidden className="size-4" />
            Lanjutkan ujian
          </Link>
        ) : s.nextSetAt ? (
          <p className="text-zinc-300">
            Percobaan di set ini sudah habis. Set baru dibuka {time.format(s.nextSetAt)}. Sambil menunggu, ulangi{" "}
            <Link href={`/latihan/${slug}`} className="text-accent hover:underline">latihannya</Link>.
          </p>
        ) : (
          <>
            <p className="mb-6 text-sm text-zinc-400">
              Waktu berjalan sejak kamu mulai. Jawaban tersimpan otomatis di perangkat ini, dan terkumpul sendiri saat waktu habis.
            </p>
            <StartExam examId={e.id} slug={slug} label={attempts?.length ? "Coba lagi" : "Mulai ujian"} />
          </>
        )}
      </div>

      {(attempts?.length ?? 0) > 0 && (
        <section aria-labelledby="riwayat" className={`mt-10 p-6 ${card}`}>
          <h2 id="riwayat" className="text-xl font-bold tracking-tight">Riwayat</h2>
          <ol className="mt-3 space-y-2">
            {/* Numbered over every attempt, timed-out ones included, as the set counts them. */}
            {attempts!.map((a, n) => ({ a, n })).filter(({ a }) => a.submitted_at).map(({ a, n }) => (
              <li key={a.id}>
                <Link href={`/ujian/${slug}/${a.id}`} className="flex min-h-14 items-center gap-4 rounded-2xl bg-zinc-800/60 px-4 py-2 hover:bg-zinc-800">
                  <span className="flex-1">Percobaan {n + 1}</span>
                  <span className={`${chip} ${a.passed ? "bg-tile-mint" : "bg-zinc-900"}`}>{a.passed ? "lulus" : "belum lulus"}</span>
                  <span className="w-10 text-right font-semibold tabular-nums">{a.score}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
