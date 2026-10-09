import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin",
  description: "Kelola materi Ruang Materi.",
  robots: { index: false },
};

export default function AdminPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Ringkasan</h1>
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Memuat...</p>}>
        <Overview />
      </Suspense>
    </>
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
  const drafts = waiting.data ?? [];

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
      <section aria-labelledby="menunggu">
        <h2 id="menunggu" className="text-lg font-semibold">Menunggu tinjauan</h2>
        {drafts.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">Tidak ada draf yang menunggu. Impor deck untuk membuat draf baru.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-800/80 border-y border-zinc-800/80">
            {drafts.map((t) => (
              <li key={t.slug}>
                <Link href={`/admin/topik/${t.slug}`} className="flex min-h-14 items-center justify-between gap-4 py-2 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent">
                  <span className="font-medium">{t.title}</span>
                  <span className="text-sm text-zinc-500">Tinjau</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="flex flex-col gap-6">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-800/80">
          <Stat label="topik terbit" value={`${published} dari ${all.length}`} />
          <Stat label="impor 24 jam terakhir" value={`${today.count ?? 0} dari 10`} />
        </dl>
        <Link
          href="/admin/impor"
          className="flex min-h-11 items-center justify-center rounded-md bg-accent px-4 font-medium text-zinc-950 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Impor deck
        </Link>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950 p-4">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

// Same window as the 10-a-day limit in check_import_limits().
function oneDayAgo() {
  return new Date(Date.now() - 864e5).toISOString();
}
