import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import PageBackdrop from "@/components/PageBackdrop";
import SiteHeader from "@/components/landing/SiteHeader";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nilai",
  description: "Nilai ujian terbaikmu dan kemajuan setiap roadmap.",
  robots: { index: false },
};

export default function NilaiPage() {
  return (
    <div className="relative">
      <PageBackdrop />
      <SiteHeader />
      <main className="px-6 pb-20 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight">Nilai</h1>
          <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Memuat...</p>}>
            <Report />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

type AttemptRow = { score: number | null; passed: boolean | null; exam_id: string; exams: { max_attempts: number; topics: { slug: string; title: string } } };
type TrackRow = { slug: string; title: string; track_nodes: { optional: boolean; topic_id: string }[] };

async function Report() {
  await requireUser("/nilai");
  const db = await createClient();
  const [{ data: attempts }, { data: tracks }, { data: progress }] = await Promise.all([
    db.from("exam_attempts").select("score, passed, exam_id, exams(max_attempts, topics(slug, title))").order("created_at"),
    db.from("tracks").select("slug, title, track_nodes(optional, topic_id)").order("created_at"),
    db.from("progress").select("topic_id, state"),
  ]);

  const done = new Set((progress ?? []).filter((p) => p.state === "selesai").map((p) => p.topic_id));
  const exams = new Map<string, { slug: string; title: string; best: number | null; tries: number; max: number; passed: boolean }>();
  for (const a of (attempts ?? []) as unknown as AttemptRow[]) {
    const e = exams.get(a.exam_id) ?? { ...a.exams.topics, best: null, tries: 0, max: a.exams.max_attempts, passed: false };
    e.tries += 1;
    e.passed ||= !!a.passed;
    if (a.score !== null) e.best = Math.max(e.best ?? 0, a.score);
    exams.set(a.exam_id, e);
  }

  return (
    <>
      <section aria-labelledby="roadmap" className="mt-10">
        <h2 id="roadmap" className="text-lg font-semibold">Roadmap</h2>
        <ul className="mt-4 space-y-5">
          {((tracks ?? []) as TrackRow[]).map((t) => {
            const core = t.track_nodes.filter((n) => !n.optional);
            const n = core.filter((c) => done.has(c.topic_id)).length;
            return (
              <li key={t.slug}>
                <div className="flex items-baseline justify-between gap-4">
                  <Link href={`/roadmap/${t.slug}`} className="font-medium hover:text-accent">{t.title}</Link>
                  <span className="text-sm text-zinc-400 tabular-nums">{n} dari {core.length} topik selesai</span>
                </div>
                <div aria-hidden className="mt-2 h-1.5 rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${core.length ? (n / core.length) * 100 : 0}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="ujian" className="mt-12">
        <h2 id="ujian" className="text-lg font-semibold">Ujian</h2>
        {exams.size === 0 ? (
          <p className="mt-3 text-zinc-400">
            Belum ada ujian yang kamu kerjakan. Buka <Link href="/roadmap" className="text-accent hover:underline">roadmap</Link> dan pilih topik untuk diuji.
          </p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="border-b border-zinc-800/80 text-zinc-500">
              <tr>
                <th className="py-2 font-normal">Topik</th>
                <th className="py-2 text-right font-normal">Nilai terbaik</th>
                <th className="hidden py-2 text-right font-normal sm:table-cell">Percobaan</th>
                <th className="py-2 text-right font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {[...exams.values()].map((e) => (
                <tr key={e.slug}>
                  <td className="py-3"><Link href={`/ujian/${e.slug}`} className="hover:text-accent">{e.title}</Link></td>
                  <td className="py-3 text-right font-semibold tabular-nums">{e.best ?? "-"}</td>
                  <td className="hidden py-3 text-right text-zinc-400 tabular-nums sm:table-cell">{e.tries}</td>
                  <td className={`py-3 text-right ${e.passed ? "text-accent" : "text-zinc-400"}`}>{e.passed ? "lulus" : "belum"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
