import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buatTrack } from "@/app/admin/roadmap/actions";
import ActionForm from "@/components/admin/ActionForm";
import StatusBadge from "@/components/admin/StatusBadge";
import { field, primaryButton } from "@/components/admin/editor";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Susun track dari topik yang sudah terbit, atur prasyaratnya, lalu terbitkan.",
  robots: { index: false },
};

export default function RoadmapAdminPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Roadmap</h1>
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Memuat...</p>}>
        <List />
      </Suspense>

      <h2 className="mt-12 text-lg font-semibold">Track baru</h2>
      <ActionForm action={buatTrack} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-zinc-400">
          Judul
          <input name="title" required className={`${field} mt-1`} placeholder="Frontend Dasar" />
        </label>
        <label className="text-sm text-zinc-400">
          Slug
          <input name="slug" required pattern="[a-z0-9\-]+" className={`${field} mt-1 font-mono`} placeholder="frontend-dasar" />
        </label>
        <label className="text-sm text-zinc-400 sm:col-span-2">
          Deskripsi
          <textarea name="description" rows={2} className={`${field} mt-1`} />
        </label>
        <button className={`${primaryButton} sm:col-span-2 sm:justify-self-end`}>Buat track</button>
      </ActionForm>
    </div>
  );
}

async function List() {
  await requireAdmin("/admin/roadmap");
  const { data: tracks } = await (await createClient())
    .from("tracks")
    .select("slug, title, status, track_nodes(count)")
    .order("created_at");

  if (!tracks?.length) return <p className="mt-6 text-zinc-400">Belum ada track. Buat yang pertama di bawah.</p>;

  return (
    <ul className="mt-6 divide-y divide-zinc-800/80 border-y border-zinc-800/80">
      {tracks.map((t) => (
        <li key={t.slug}>
          <Link href={`/admin/roadmap/${t.slug}`} className="group flex min-h-16 items-center gap-4 py-3 focus-visible:outline-2 focus-visible:outline-accent">
            <span className="min-w-0 flex-1">
              <span className="block font-medium group-hover:text-accent">{t.title}</span>
              <span className="font-mono text-xs text-zinc-500">{t.slug}</span>
            </span>
            <span className="text-sm text-zinc-400 tabular-nums">{t.track_nodes[0]?.count ?? 0} topik</span>
            <StatusBadge status={t.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
