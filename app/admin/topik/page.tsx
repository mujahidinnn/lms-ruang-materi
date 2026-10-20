import { FileUp, Search } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import Ring from "@/components/ui/Ring";
import { card, chip, primaryButton, tile } from "@/components/ui/styles";
import { requireAdmin } from "@/lib/dal";
import { slideUrl } from "@/lib/slides";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Topik",
  description: "Daftar topik dan draf yang menunggu tinjauan.",
  robots: { index: false },
};

const TABS = [
  { key: "", label: "Semua" },
  { key: "tinjau", label: "Menunggu tinjauan" },
  { key: "terbit", label: "Terbit" },
  { key: "draf", label: "Draf" },
] as const;

export default function TopikListPage({ searchParams }: PageProps<"/admin/topik">) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Topik</h1>
        <Link href="/admin/impor" className={primaryButton}><FileUp aria-hidden className="size-4" />Impor deck</Link>
      </div>
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Memuat...</p>}>
        <List searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

type Row = {
  slug: string;
  title: string;
  status: string;
  draft_summary: string | null;
  slides: { index: number; path: string }[];
  chapters: { status: string }[];
};

async function List({ searchParams }: Pick<PageProps<"/admin/topik">, "searchParams">) {
  await requireAdmin("/admin/topik");
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const db = await createClient();
  const { data } = await db
    .from("topics")
    .select("slug, title, status, draft_summary, slides(index, path), chapters(status)")
    .order("created_at");
  const all = (data ?? []) as Row[];

  if (!all.length) {
    return (
      <p className="mt-6 text-zinc-400">
        Belum ada topik. <Link href="/admin/impor" className="text-accent hover:underline">Impor deck</Link> untuk membuat yang pertama.
      </p>
    );
  }

  const inTab = (t: Row, key: string) =>
    key === "tinjau" ? !!t.draft_summary : key === "terbit" ? t.status === "published" : key === "draf" ? t.status === "draft" : true;
  const needle = q.toLowerCase();
  const topics = all.filter((t) => inTab(t, tab) && (!needle || t.title.toLowerCase().includes(needle) || t.slug.includes(needle)));
  const href = (key: string) => `/admin/topik?${new URLSearchParams({ ...(key && { tab: key }), ...(q && { q }) })}`;

  return (
    <>
      <nav aria-label="Saring topik" className="scrollbar-thin mt-6 flex gap-6 overflow-x-auto border-b border-zinc-800">
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <Link
              key={t.key}
              href={href(t.key)}
              aria-current={on ? "page" : undefined}
              className={`-mb-px flex min-h-11 shrink-0 items-center gap-2 border-b-2 text-sm ${on ? "border-accent font-semibold text-zinc-50" : "border-transparent text-zinc-400 hover:text-zinc-50"}`}
            >
              {t.label}
              <span className="rounded-full bg-zinc-800 px-2 text-xs tabular-nums">{all.filter((x) => inTab(x, t.key)).length}</span>
            </Link>
          );
        })}
      </nav>

      <form className="mt-5 flex flex-wrap items-center gap-3">
        {tab && <input type="hidden" name="tab" value={tab} />}
        <p className="text-sm font-semibold tabular-nums">{topics.length} topik</p>
        <label className="flex min-h-11 flex-1 items-center gap-2 rounded-full bg-zinc-900 px-4 shadow-soft focus-within:ring-2 focus-within:ring-accent sm:max-w-xs">
          <Search aria-hidden className="size-4 text-zinc-500" />
          <span className="sr-only">Cari topik</span>
          <input name="q" type="search" defaultValue={q} placeholder="Cari judul atau slug" className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500" />
        </label>
      </form>

      {topics.length === 0 ? (
        <p className="mt-8 text-zinc-400">Tidak ada topik yang cocok. <Link href="/admin/topik" className="text-accent hover:underline">Tampilkan semua</Link></p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t, i) => {
            const first = t.slides.toSorted((a, b) => a.index - b.index)[0];
            const live = t.chapters.filter((c) => c.status === "published").length;
            const total = t.chapters.filter((c) => c.status !== "archived").length;
            return (
              <li key={t.slug}>
                <Link
                  href={`/admin/topik/${t.slug}`}
                  className={`group flex h-full flex-col p-2 transition-shadow hover:ring-2 hover:ring-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${card}`}
                >
                  <div className={`relative aspect-[2/1] overflow-hidden rounded-[22px] ${tile(i)}`}>
                    {first && (
                      <Image
                        src={slideUrl(first.path).replace(/slide-\d+\.avif$/, "cover.avif")}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    )}
                    <span className={`${chip} absolute top-3 left-3 bg-zinc-900/90 tabular-nums`}>{t.slides.length} slide</span>
                    {t.draft_summary && <span className={`${chip} absolute top-3 right-3 bg-tile-butter`}>Menunggu tinjauan</span>}
                  </div>
                  <div className="flex flex-1 flex-col px-3 pt-4 pb-3">
                    <h2 className="text-lg leading-snug font-bold tracking-tight group-hover:text-accent">{t.title}</h2>
                    <div className="mt-4 mb-4 flex items-center gap-3">
                      <Ring value={live} max={total} className="size-10" />
                      <p className="text-sm">
                        <span className="block text-xs text-zinc-500">Bab terbit</span>
                        <span className="font-semibold tabular-nums">{total ? `${live} dari ${total}` : "Belum ada bab"}</span>
                      </p>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
                      <span className="truncate text-xs text-zinc-500">{t.slug}</span>
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
