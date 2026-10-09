import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Topik",
  description: "Daftar topik dan draf yang menunggu tinjauan.",
  robots: { index: false },
};

export default function TopikListPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <div>
        <Link href="/admin" className="text-sm text-zinc-400 hover:text-zinc-50">&larr; Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold">Topik</h1>
      </div>
      <Suspense fallback={<p className="text-sm text-zinc-500">Memuat...</p>}>
        <List />
      </Suspense>
    </main>
  );
}

async function List() {
  await requireAdmin("/admin/topik");
  const db = await createClient();
  const [{ data: topics }, { data: drafts }] = await Promise.all([
    db.from("topics").select("slug, title, status, draft_summary").order("created_at"),
    db.from("tips").select("topic:topics(slug)").eq("status", "draft"),
  ]);
  const pending = new Set((drafts ?? []).map((d) => (d.topic as unknown as { slug: string }).slug));

  if (!topics?.length) return <p className="text-sm text-zinc-500">Belum ada topik. Mulai dari impor materi.</p>;

  return (
    <ul className="divide-y divide-zinc-800/80 rounded-lg border border-zinc-800/80">
      {topics.map((t) => (
        <li key={t.slug}>
          <Link href={`/admin/topik/${t.slug}`} className="flex min-h-11 items-center gap-3 px-4 py-2 hover:bg-zinc-900">
            <span className="flex-1">{t.title}</span>
            {(pending.has(t.slug) || t.draft_summary) && <span className="text-xs text-accent">draf menunggu</span>}
            <StatusBadge status={t.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
