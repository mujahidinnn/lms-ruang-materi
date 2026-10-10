import type { Metadata } from "next";
import { Award } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import SiteHeader from "@/components/landing/SiteHeader";
import AccountNav from "@/components/dashboard/AccountNav";
import TrackProgress from "@/components/dashboard/TrackProgress";
import { requireUser } from "@/lib/dal";
import { card, chip } from "@/components/ui/styles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nilai",
  description: "Nilai ujian terbaikmu dan kemajuan setiap roadmap.",
  robots: { index: false },
};

export default function NilaiPage() {
  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 px-5 pb-20 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Nilai</h1>
          <div className="mt-5"><AccountNav current="/nilai" /></div>
          <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Memuat...</p>}>
            <Report />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

type AttemptRow = { score: number | null; passed: boolean | null; exam_id: string; exams: { max_attempts: number; topics: { slug: string; title: string } | null } | null };
type TrackRow = { id: string; slug: string; title: string };

async function Report() {
  const user = await requireUser("/nilai");
  const db = await createClient();
  const [{ data: attempts }, { data: tracks }, { data: levels }, { data: badges }, { data: streak }] = await Promise.all([
    db.from("exam_attempts").select("score, passed, exam_id, exams(max_attempts, topics(slug, title))").eq("user_id", user.id).order("created_at"),
    db.from("tracks").select("id, slug, title").order("created_at"),
    db.from("track_levels").select("slug, core_passed, core_total"),
    db.from("badges").select("track_id").eq("user_id", user.id),
    db.from("learning_streaks").select("best_days").eq("user_id", user.id).maybeSingle(),
  ]);

  const levelBySlug = new Map((levels ?? []).map((l) => [l.slug, l]));
  const earned = new Set((badges ?? []).map((b) => b.track_id));
  const exams = new Map<string, { slug: string; title: string; best: number | null; tries: number; max: number; passed: boolean }>();
  for (const a of (attempts ?? []) as unknown as AttemptRow[]) {
    // Exams of unpublished topics come back as null embeds.
    if (!a.exams?.topics) continue;
    const e = exams.get(a.exam_id) ?? { ...a.exams.topics, best: null, tries: 0, max: a.exams.max_attempts, passed: false };
    e.tries += 1;
    e.passed ||= !!a.passed;
    if (a.score !== null) e.best = Math.max(e.best ?? 0, a.score);
    exams.set(a.exam_id, e);
  }

  return (
    <>
      <section aria-labelledby="roadmap" className={`mt-8 p-6 ${card}`}>
        <h2 id="roadmap" className="text-xl font-bold tracking-tight">Roadmap</h2>
        <ul className="mt-4 space-y-5">
          {((tracks ?? []) as TrackRow[]).map((t) => {
            const l = levelBySlug.get(t.slug);
            return (
              <li key={t.slug}>
                <TrackProgress slug={t.slug} title={t.title} passed={l?.core_passed ?? 0} total={l?.core_total ?? 0} />
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="lencana" className="mt-4 grid gap-4 sm:grid-cols-[1fr_14rem]">
        <div className={`p-6 ${card}`}>
          <h2 id="lencana" className="text-xl font-bold tracking-tight">Lencana</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {((tracks ?? []) as TrackRow[]).map((t) => {
              const got = earned.has(t.id);
              return (
                <li
                  key={t.id}
                  className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium ${got ? "bg-tile-butter text-zinc-50" : "border border-dashed border-zinc-700 text-zinc-500"}`}
                >
                  <Award aria-hidden className={`size-4 ${got ? "text-accent-warm" : ""}`} />
                  {t.title}
                  <span className="sr-only">{got ? ", didapat" : ", belum"}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-zinc-500">Lencana didapat setelah lulus ujian semua topik inti satu roadmap.</p>
        </div>
        <div className="rounded-[28px] bg-tile-peach p-6">
          <h2 className="text-sm font-medium text-zinc-300">Streak terbaik</h2>
          <p className="mt-2 text-5xl font-bold tracking-tight tabular-nums">{streak?.best_days ?? 0}<span className="ml-1.5 text-base font-medium text-zinc-300">hari</span></p>
        </div>
      </section>

      <section aria-labelledby="ujian" className={`mt-4 p-6 ${card}`}>
        <h2 id="ujian" className="text-xl font-bold tracking-tight">Ujian</h2>
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
                  <td className="py-3 text-right"><span className={`${chip} ${e.passed ? "bg-tile-mint" : "bg-zinc-800"}`}>{e.passed ? "lulus" : "belum"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
