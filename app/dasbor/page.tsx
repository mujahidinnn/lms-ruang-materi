import { Layers, Play, Route } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AccountNav from "@/components/dashboard/AccountNav";
import Room from "@/components/illustrations/Room";
import TrackProgress from "@/components/dashboard/TrackProgress";
import SiteHeader from "@/components/landing/SiteHeader";
import { primaryButton } from "@/components/ui/styles";
import { setujuiWali } from "@/app/profil/actions";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dasbor",
  description: "Lanjutkan belajar, ulangi kartu yang jatuh tempo, dan lihat kemajuan roadmap kamu.",
  robots: { index: false },
};

export default function DasborPage() {
  return (
    <div className="relative">
      <SiteHeader />
      <main className="px-6 pb-20 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight">Dasbor</h1>
            <AccountNav current="/dasbor" />
          </div>
          <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Memuat...</p>}>
            <Home />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

type Recent = { state: string; last_slide: number; topics: { id: string; slug: string; title: string; slides: { count: number }[] } | null };
type ExamRow = { id: string; topics: { slug: string; title: string } | null };
type TrackRow = { slug: string; title: string; track_nodes: { topic_id: string }[] };

async function Home() {
  const user = await requireUser("/dasbor");
  const db = await createClient();
  const { data: me } = await db.from("profiles").select("guardian_consent").eq("user_id", user.id).single();
  const consent = user.role === "admin" || !!me?.guardian_consent;
  return (
    <>
      {!consent && (
        <form action={setujuiWali} className="mt-8 flex flex-col gap-4 rounded-2xl border border-accent-warm/40 p-6 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-zinc-300">
            Sebelum progres belajarmu disimpan, konfirmasi dulu: kamu berusia 18 tahun ke atas, atau orang tua atau wali sudah setuju kamu memakai Ruang Materi.
          </p>
          <button className={primaryButton}>Saya konfirmasi</button>
        </form>
      )}
      <Overview userId={user.id} />
    </>
  );
}

async function Overview({ userId }: { userId: string }) {
  const db = await createClient();
  const user = { id: userId };
  const [{ data: progress }, { data: streak }, { data: queue }, { data: levels }, { data: tracks }, { data: passed }] = await Promise.all([
    db.from("progress").select("state, last_slide, topics(id, slug, title, slides(count))").eq("user_id", user.id).order("updated_at", { ascending: false }),
    db.from("learning_streaks").select("current_days").eq("user_id", user.id).maybeSingle(),
    db.rpc("flashcard_queue"),
    db.from("track_levels").select("slug, core_passed, core_total"),
    db.from("tracks").select("slug, title, track_nodes(topic_id)").order("created_at"),
    db.from("exam_attempts").select("exam_id").eq("user_id", user.id).eq("passed", true),
  ]);

  // A topic pulled from publication comes back as a null embed; skip it.
  const rows = ((progress ?? []) as unknown as Recent[]).filter((r): r is Recent & { topics: NonNullable<Recent["topics"]> } => !!r.topics);
  if (rows.length === 0) {
    return (
      <div className="mt-12 flex flex-col gap-6 rounded-2xl border border-zinc-800/80 p-8 sm:flex-row sm:items-center">
        <Room className="size-20 shrink-0">
          <rect x="24" y="40" width="36" height="27" rx="5" className="fill-accent" />
        </Room>
        <div>
          <p className="text-lg font-semibold">Mulai dari satu roadmap</p>
          <p className="mt-1 text-zinc-400">Pilih jalur belajar, lalu buka topik pertamanya. Kemajuanmu tersimpan otomatis.</p>
          <Link href="/roadmap" className={`${primaryButton} mt-6`}><Route aria-hidden className="size-4" />Pilih track pertama</Link>
        </div>
      </div>
    );
  }

  const latest = rows[0].topics;
  const slideTotal = latest.slides[0]?.count ?? 0;
  const days = streak?.current_days ?? 0;
  const due = (queue ?? []) as { box: number | null }[];
  const open = rows.filter((r) => r.state === "sedang").map((r) => r.topics.id);
  const passedIds = new Set((passed ?? []).map((p) => p.exam_id));
  const { data: exams } = open.length
    ? await db.from("exams").select("id, topics(slug, title)").in("topic_id", open)
    : { data: [] };
  const openExams = ((exams ?? []) as unknown as ExamRow[]).filter((e): e is ExamRow & { topics: NonNullable<ExamRow["topics"]> } => !!e.topics && !passedIds.has(e.id));
  const touched = new Set(rows.map((r) => r.topics.id));
  const myTracks = ((tracks ?? []) as TrackRow[]).filter((t) => t.track_nodes.some((n) => touched.has(n.topic_id)));
  const levelBySlug = new Map((levels ?? []).map((l) => [l.slug, l]));

  return (
    <div className="mt-8 grid gap-4">
      <section aria-labelledby="lanjut" className="grid gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h2 id="lanjut" className="text-sm text-zinc-400">Lanjutkan belajar</h2>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{latest.title}</p>
          {slideTotal > 0 && (
            <p className="mt-1 text-sm text-zinc-400 tabular-nums">Slide {Math.min(rows[0].last_slide + 1, slideTotal)} dari {slideTotal}</p>
          )}
          <p className={`mt-2 text-sm ${days ? "text-accent-warm" : "text-zinc-400"}`}>
            {days ? `Streak ${days} hari` : "Mulai lagi hari ini"}
          </p>
        </div>
        <Link href={`/belajar/${latest.slug}`} className={primaryButton}><Play aria-hidden className="size-4" />Lanjutkan</Link>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="kartu" className="rounded-2xl border border-zinc-800/80 p-6">
          <h2 id="kartu" className="font-semibold">
            {due.length ? `${due.length} kartu siap diulang` : "Belum ada kartu jatuh tempo"}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {due.length
              ? `${due.filter((c) => c.box === null).length} di antaranya kartu baru.`
              : "Kartu dari topik yang kamu buka muncul di sini sesuai jadwalnya."}
          </p>
          {due.length > 0 && (
            <Link href="/flashcard" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-800 px-4 text-sm hover:border-zinc-600">
              <Layers aria-hidden className="size-4" />
              Mulai review
            </Link>
          )}
        </section>

        <section aria-labelledby="ujian" className="rounded-2xl border border-zinc-800/80 p-6">
          <h2 id="ujian" className="font-semibold">Ujian terbuka</h2>
          {openExams.length ? (
            <ul className="mt-2 space-y-1">
              {openExams.map((e) => (
                <li key={e.id}>
                  <Link href={`/ujian/${e.topics.slug}`} className="flex min-h-11 items-center justify-between gap-3 hover:text-accent">
                    {e.topics.title}
                    <span className="text-sm text-zinc-500">belum lulus</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-zinc-400">Tidak ada ujian untuk topik yang sedang kamu pelajari.</p>
          )}
        </section>
      </div>

      {myTracks.length > 0 && (
        <section aria-labelledby="track" className="rounded-2xl border border-zinc-800/80 p-6">
          <h2 id="track" className="font-semibold">Roadmap kamu</h2>
          <ul className="mt-4 space-y-5">
            {myTracks.map((t) => {
              const l = levelBySlug.get(t.slug);
              return (
                <li key={t.slug}>
                  <TrackProgress slug={t.slug} title={t.title} passed={l?.core_passed ?? 0} total={l?.core_total ?? 0} />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
