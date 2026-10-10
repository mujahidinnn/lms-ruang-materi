import { FileSearch, FileUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ProgressStat from "@/components/admin/ProgressStat";
import { primaryButton } from "@/components/admin/editor";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin",
  description: "Kelola materi Ruang Materi.",
  robots: { index: false },
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Suspense fallback={<p className="text-sm text-zinc-500">Memuat...</p>}>
        <Overview />
      </Suspense>
    </div>
  );
}

async function Overview() {
  await requireAdmin();
  const db = await createClient();
  const [topics, waiting, today] = await Promise.all([
    db.from("topics").select("status"),
    db.from("topics").select("slug, title").not("draft_summary", "is", null).order("title"),
    db.from("import_jobs").select("id", { count: "exact", head: true }).gte("created_at", oneDayAgo()),
  ]);
  const all = topics.data ?? [];
  const published = all.filter((t) => t.status === "published").length;
  const [next, ...rest] = waiting.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Ringkasan</h1>

      <section aria-labelledby="fokus" className="rounded-[28px] bg-tile-lavender p-6 sm:p-8">
        {next ? (
          <>
            <p className="text-sm text-accent">{rest.length + 1} draf menunggu tinjauan</p>
            <h2 id="fokus" className="mt-2 text-2xl font-bold tracking-tight">{next.title}</h2>
            <p className="mt-1 max-w-prose text-zinc-400">Periksa ringkasan, tips dan soal dari model, lalu terbitkan.</p>
            <Link href={`/admin/topik/${next.slug}`} className={`${primaryButton} mt-6`}><FileSearch aria-hidden className="size-4" />Tinjau draf</Link>
          </>
        ) : (
          <>
            <h2 id="fokus" className="text-2xl font-bold tracking-tight">Semua draf sudah ditinjau</h2>
            <p className="mt-1 max-w-prose text-zinc-400">Impor deck baru untuk menambah materi.</p>
            <Link href="/admin/impor" className={`${primaryButton} mt-6`}><FileUp aria-hidden className="size-4" />Impor deck</Link>
          </>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <ProgressStat label="Topik terbit" value={published} max={all.length} />
        <ProgressStat label="Impor 24 jam terakhir" value={today.count ?? 0} max={10} />
      </div>

      {rest.length > 0 && (
        <section aria-labelledby="antrean">
          <h2 id="antrean" className="text-xl font-bold tracking-tight">Draf lain</h2>
          <ul className="mt-3 divide-y divide-zinc-800 rounded-[28px] bg-zinc-900 px-5 shadow-soft">
            {rest.map((t) => (
              <li key={t.slug}>
                <Link href={`/admin/topik/${t.slug}`} className="flex min-h-12 items-center justify-between gap-4 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent">
                  {t.title}
                  <span className="text-sm text-zinc-500">Tinjau</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// Same window as the 10-a-day limit in check_import_limits().
function oneDayAgo() {
  return new Date(Date.now() - 864e5).toISOString();
}
