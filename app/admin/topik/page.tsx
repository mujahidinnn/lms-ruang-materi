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
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Topik</h1>
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Memuat...</p>}>
        <List />
      </Suspense>
    </div>
  );
}

async function List() {
  await requireAdmin("/admin/topik");
  const db = await createClient();
  const { data: topics } = await db
    .from("topics")
    .select("slug, title, status, draft_summary, slides(count)")
    .order("created_at");

  if (!topics?.length) {
    return (
      <p className="mt-6 text-zinc-400">
        Belum ada topik. <Link href="/admin/impor" className="text-accent hover:underline">Impor deck</Link> untuk membuat yang pertama.
      </p>
    );
  }

  return (
    <ul className="mt-6 divide-y divide-zinc-800 rounded-[28px] bg-zinc-900 px-5 shadow-soft">
      {topics.map((t) => (
        <li key={t.slug}>
          <Link href={`/admin/topik/${t.slug}`} className="group flex min-h-16 items-center gap-4 py-3 focus-visible:outline-2 focus-visible:outline-accent">
            <span className="min-w-0 flex-1">
              <span className="block font-medium group-hover:text-accent">{t.title}</span>
              <span className="font-mono text-xs text-zinc-500">{t.slug}</span>
            </span>
            {t.draft_summary && <span className="text-sm text-zinc-400">Draf menunggu</span>}
            <StatusBadge status={t.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
