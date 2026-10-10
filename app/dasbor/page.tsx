import { Flame, Layers, Play, Route } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AccountNav from "@/components/dashboard/AccountNav";
import Room from "@/components/illustrations/Room";
import TrackProgress from "@/components/dashboard/TrackProgress";
import SiteHeader from "@/components/landing/SiteHeader";
import ArrowBadge from "@/components/ui/ArrowBadge";
import { card, chip, primaryButton, secondaryButton } from "@/components/ui/styles";
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
    <div className="relative flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 px-5 pb-20 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Dasbor</h1>
          <div className="mt-5"><AccountNav current="/dasbor" /></div>
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
        <form action={setujuiWali} className="mt-8 flex flex-col gap-4 rounded-[28px] bg-tile-butter p-6 sm:flex-row sm:items-center">
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
      <div className="mt-8 flex flex-col gap-6 rounded-[28px] bg-tile-lavender p-8 sm:flex-row sm:items-center">
        <Room className="size-20 shrink-0">
          <rect x="24" y="40" width="36" height="27" rx="5" className="fill-brand" />
        </Room>
        <div>
          <p className="text-2xl font-bold tracking-tight">Mulai dari satu roadmap</p>
          <p className="mt-1 text-zinc-300">Pilih jalur belajar, lalu buka topik pertamanya. Kemajuanmu tersimpan otomatis.</p>
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
      <section aria-labelledby="lanjut" className="rounded-[28px] bg-tile-lavender p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="lanjut" className="text-sm font-medium text-zinc-300">Lanjutkan belajar</h2>
          <span className={`${chip} ${days ? "bg-tile-butter" : "bg-zinc-900/70"}`}>
            <Flame aria-hidden className={`size-3.5 ${days ? "text-accent-warm" : ""}`} />
            {days ? `Streak ${days} hari` : "Mulai lagi hari ini"}
          </span>
        </div>
        <p className="mt-4 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{latest.title}</p>
        {slideTotal > 0 && (
          <div className="mt-5 max-w-md">
            <p className="text-sm text-zinc-300 tabular-nums">Slide {Math.min(rows[0].last_slide + 1, slideTotal)} dari {slideTotal}</p>
            <div aria-hidden className="mt-2 h-2.5 rounded-full bg-zinc-900/70">
              <div className="h-full rounded-full bg-zinc-50" style={{ width: `${(Math.min(rows[0].last_slide + 1, slideTotal) / slideTotal) * 100}%` }} />
            </div>
          </div>
        )}
        <Link href={`/belajar/${latest.slug}`} className={`${primaryButton} mt-6`}><Play aria-hidden className="size-4" />Lanjutkan</Link>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="kartu" className="rounded-[28px] bg-tile-mint p-6">
          <h2 id="kartu" className="text-xl font-bold tracking-tight">
            {due.length ? `${due.length} kartu siap diulang` : "Belum ada kartu jatuh tempo"}
          </h2>
          <p className="mt-1 text-sm text-zinc-300">
            {due.length
              ? `${due.filter((c) => c.box === null).length} di antaranya kartu baru.`
              : "Kartu dari topik yang kamu buka muncul di sini sesuai jadwalnya."}
          </p>
          {due.length > 0 && (
            <Link href="/flashcard" className={`${secondaryButton} mt-5`}>
              <Layers aria-hidden className="size-4" />
              Mulai review
            </Link>
          )}
        </section>

        <section aria-labelledby="ujian" className={`p-6 ${card}`}>
          <h2 id="ujian" className="text-xl font-bold tracking-tight">Ujian terbuka</h2>
          {openExams.length ? (
            <ul className="mt-3 space-y-2">
              {openExams.map((e) => (
                <li key={e.id}>
                  <Link href={`/ujian/${e.topics.slug}`} className="group flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-zinc-800/60 py-1.5 pr-1.5 pl-4 font-medium hover:bg-zinc-800">
                    {e.topics.title}
                    <ArrowBadge className="size-10" />
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
        <section aria-labelledby="track" className={`p-6 ${card}`}>
          <h2 id="track" className="text-xl font-bold tracking-tight">Roadmap kamu</h2>
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
