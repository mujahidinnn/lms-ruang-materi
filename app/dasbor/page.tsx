import { Flame, Layers, Play, Route } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Room from "@/components/illustrations/Room";
import MonthCalendar from "@/components/dashboard/MonthCalendar";
import AppShell from "@/components/app/AppShell";
import { UserFoot } from "@/components/app/AccountFoot";
import ArrowBadge from "@/components/ui/ArrowBadge";
import Ring from "@/components/ui/Ring";
import { card, chip, primaryButton, secondaryButton, tile } from "@/components/ui/styles";
import { levelFor } from "@/lib/level";
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
    <AppShell set="akun" account={<UserFoot next="/dasbor" />}>
      <div className="mx-auto max-w-6xl">
        <Suspense fallback={<p className="text-sm text-zinc-500">Memuat...</p>}>
          <Home />
        </Suspense>
      </div>
    </AppShell>
  );
}

type Recent = {
  state: string;
  last_slide: number;
  topics: { id: string; slug: string; title: string; slides: { count: number }[] } | null;
  last_chapter: { slug: string; title: string } | null;
};
type ExamRow = { id: string; topics: { slug: string; title: string } | null };
type TrackRow = { slug: string; title: string; track_nodes: { topic_id: string }[] };

async function Home() {
  const user = await requireUser("/dasbor");
  const db = await createClient();
  const { data: me } = await db.from("profiles").select("display_name, timezone, guardian_consent").eq("user_id", user.id).single();
  const consent = user.role === "admin" || !!me?.guardian_consent;
  const name = me?.display_name?.trim() || user.email.split("@")[0];
  return (
    <>
      {!consent && (
        <form action={setujuiWali} className="mb-5 flex flex-col gap-4 rounded-[28px] bg-tile-butter p-6 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-zinc-300">
            Sebelum progres belajarmu disimpan, konfirmasi dulu: kamu berusia 18 tahun ke atas, atau orang tua atau wali sudah setuju kamu memakai Ruang Materi.
          </p>
          <button className={primaryButton}>Saya konfirmasi</button>
        </form>
      )}
      <Overview userId={user.id} name={name} timezone={me?.timezone ?? "Asia/Jakarta"} />
    </>
  );
}

async function Overview({ userId, name, timezone }: { userId: string; name: string; timezone: string }) {
  const db = await createClient();
  // en-CA formats as YYYY-MM-DD, the same shape as learning_days.day.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
  const [{ data: progress }, { data: streak }, { data: queue }, { data: levels }, { data: tracks }, { data: passed }, { data: days }] = await Promise.all([
    db.from("progress").select("state, last_slide, topics(id, slug, title, slides(count)), last_chapter:chapters!progress_last_chapter_id_fkey(slug, title)").eq("user_id", userId).order("updated_at", { ascending: false }),
    db.from("learning_streaks").select("current_days, best_days").eq("user_id", userId).maybeSingle(),
    db.rpc("flashcard_queue"),
    db.from("track_levels").select("slug, core_passed, core_total"),
    db.from("tracks").select("slug, title, track_nodes(topic_id)").order("created_at"),
    db.from("exam_attempts").select("exam_id").eq("user_id", userId).eq("passed", true),
    db.from("learning_days").select("day").eq("user_id", userId).gte("day", `${today.slice(0, 8)}01`),
  ]);

  // A topic pulled from publication comes back as a null embed; skip it.
  const rows = ((progress ?? []) as unknown as Recent[]).filter((r): r is Recent & { topics: NonNullable<Recent["topics"]> } => !!r.topics);
  const streakDays = streak?.current_days ?? 0;
  const calendar = (
    <section aria-labelledby="kalender" className={`p-6 ${card}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="kalender" className="text-lg font-bold tracking-tight">Hari belajar</h2>
        <span className={`${chip} ${streakDays ? "bg-tile-butter" : "bg-zinc-800"}`}>
          <Flame aria-hidden className={`size-3.5 ${streakDays ? "text-accent-warm" : ""}`} />
          {streakDays ? `Streak ${streakDays} hari` : "Mulai lagi hari ini"}
        </span>
      </div>
      <div className="mt-4"><MonthCalendar today={today} studied={new Set((days ?? []).map((d) => d.day))} /></div>
      {!!streak?.best_days && <p className="mt-3 text-xs text-zinc-500">Streak terbaikmu {streak.best_days} hari.</p>}
    </section>
  );

  if (rows.length === 0) {
    return (
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Welcome name={name}>
          <p className="mt-2 max-w-md text-zinc-300">Pilih jalur belajar, lalu buka topik pertamanya. Kemajuanmu tersimpan otomatis.</p>
          <Link href="/roadmap" className={`${primaryButton} mt-6`}><Route aria-hidden className="size-4" />Pilih roadmap pertama</Link>
        </Welcome>
        {calendar}
      </div>
    );
  }

  const latest = rows[0];
  const slideTotal = latest.topics.slides[0]?.count ?? 0;
  const slideAt = Math.min(latest.last_slide + 1, slideTotal);
  const due = (queue ?? []) as { box: number | null }[];
  const done = rows.filter((r) => r.state === "selesai").length;
  const open = rows.filter((r) => r.state === "sedang").map((r) => r.topics.id);
  const passedIds = new Set((passed ?? []).map((p) => p.exam_id));
  const { data: exams } = open.length
    ? await db.from("exams").select("id, topics(slug, title)").in("topic_id", open)
    : { data: [] };
  const openExams = ((exams ?? []) as unknown as ExamRow[]).filter((e): e is ExamRow & { topics: NonNullable<ExamRow["topics"]> } => !!e.topics && !passedIds.has(e.id));
  const touched = new Set(rows.map((r) => r.topics.id));
  const myTracks = ((tracks ?? []) as TrackRow[]).filter((t) => t.track_nodes.some((n) => touched.has(n.topic_id)));
  const levelBySlug = new Map((levels ?? []).map((l) => [l.slug, l]));
  const donePct = Math.round((done / rows.length) * 100);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid min-w-0 content-start gap-5">
        <Welcome name={name}>
          <p className="mt-2 text-zinc-300">
            Kamu sudah menyelesaikan <strong className="text-accent-warm">{donePct}%</strong> topik yang kamu buka.
          </p>
          <div className="mt-6 max-w-md rounded-2xl bg-zinc-900/70 p-4">
            <p className="text-xs text-zinc-400">Lanjutkan belajar</p>
            <p className="mt-0.5 font-semibold">{latest.topics.title}</p>
            {latest.last_chapter ? (
              <p className="mt-0.5 text-sm text-zinc-400">Bab terakhir: {latest.last_chapter.title}</p>
            ) : slideTotal > 0 && (
              <>
                <p className="mt-0.5 text-sm text-zinc-400 tabular-nums">Slide {slideAt} dari {slideTotal}</p>
                <div aria-hidden className="mt-2 h-2 rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(slideAt / slideTotal) * 100}%` }} />
                </div>
              </>
            )}
          </div>
          <Link
            href={latest.last_chapter ? `/belajar/${latest.topics.slug}/${latest.last_chapter.slug}` : `/belajar/${latest.topics.slug}`}
            className={`${primaryButton} mt-5`}
          >
            <Play aria-hidden className="size-4" />Lanjutkan
          </Link>
        </Welcome>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <section aria-labelledby="track" className={`p-6 ${card}`}>
            <div className="flex items-center justify-between gap-3">
              <h2 id="track" className="text-lg font-bold tracking-tight">Kemajuan roadmap</h2>
              <Link href="/nilai" className="rounded-full bg-tile-lavender px-3 py-1 text-xs font-medium text-accent hover:underline">Lihat nilai</Link>
            </div>
            {myTracks.length ? (
              <ul className="mt-5 space-y-5">
                {myTracks.map((t, i) => {
                  const l = levelBySlug.get(t.slug);
                  const passedCount = l?.core_passed ?? 0;
                  const total = l?.core_total ?? 0;
                  const pct = total ? Math.round((passedCount / total) * 100) : 0;
                  return (
                    <li key={t.slug} className="flex items-center gap-4">
                      <span aria-hidden className={`grid size-11 shrink-0 place-items-center rounded-2xl text-sm font-bold ${tile(i)}`}>{t.title.slice(0, 2)}</span>
                      <div className="min-w-0 flex-1">
                        <Link href={`/roadmap/${t.slug}`} className="block truncate font-semibold hover:text-accent">{t.title}</Link>
                        <p className="text-xs text-zinc-500 tabular-nums">{levelFor(passedCount, total)}, {passedCount} dari {total} topik lulus</p>
                        <div aria-hidden className="mt-2 h-2 rounded-full bg-zinc-800">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-on-primary tabular-nums">{pct}%</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">Topik yang kamu buka belum masuk roadmap mana pun.</p>
            )}
          </section>

          <section aria-labelledby="topik" className={`flex flex-col p-6 ${card}`}>
            <h2 id="topik" className="text-lg font-bold tracking-tight">Topik kamu</h2>
            <Ring value={done} max={rows.length} stroke={4} className="mx-auto mt-5 size-40">
              <span className="text-center">
                <span className="block text-3xl font-bold tabular-nums">{donePct}%</span>
                <span className="text-xs text-zinc-500">selesai</span>
              </span>
            </Ring>
            <ul className="mt-5 flex justify-center gap-5 text-sm tabular-nums">
              <li className="flex items-center gap-2"><span aria-hidden className="size-2.5 rounded-full bg-brand" />{done} selesai</li>
              <li className="flex items-center gap-2"><span aria-hidden className="size-2.5 rounded-full bg-zinc-700" />{open.length} sedang</li>
            </ul>
          </section>
        </div>
      </div>

      <div className="grid content-start gap-5">
        {calendar}

        <section aria-labelledby="kartu" className="rounded-[28px] bg-tile-mint p-6">
          <h2 id="kartu" className="text-lg font-bold tracking-tight">
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
          <h2 id="ujian" className="text-lg font-bold tracking-tight">Ujian terbuka</h2>
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
    </div>
  );
}

// The greeting banner, with the room illustration on wider screens.
function Welcome({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby="sapa" className="relative flex overflow-hidden rounded-[32px] bg-tile-lavender p-6 sm:p-8">
      <div className="min-w-0 flex-1">
        <h1 id="sapa" className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Halo, <span className="text-accent">{name}</span>!
        </h1>
        {children}
      </div>
      <Room className="ml-6 hidden size-44 shrink-0 self-center sm:block">
        <rect x="22" y="30" width="44" height="32" rx="6" className="fill-zinc-900" />
        <path d="M40 39v14l11-7z" className="fill-brand" />
        <rect x="30" y="68" width="28" height="5" rx="2.5" className="fill-brand" />
      </Room>
    </section>
  );
}
