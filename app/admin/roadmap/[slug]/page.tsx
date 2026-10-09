import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { hapus, simpanNode, simpanTrack, tambahEdge, tambahNode } from "@/app/admin/roadmap/actions";
import ActionForm from "@/components/admin/ActionForm";
import StatusBadge from "@/components/admin/StatusBadge";
import TrackActions from "@/components/admin/TrackActions";
import { field, primaryButton, smallButton } from "@/components/admin/editor";
import RoadmapGraph from "@/components/roadmap/RoadmapGraph";
import { requireAdmin } from "@/lib/dal";
import { layout } from "@/lib/roadmap";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit roadmap",
  description: "Atur topik dan prasyarat sebuah track.",
  robots: { index: false },
};

type Node = { id: string; position: number; optional: boolean; status: string; topics: { slug: string; title: string; status: string } };
type Edge = { id: string; from_node_id: string; to_node_id: string; status: string };

export default function RoadmapEditPage(props: PageProps<"/admin/roadmap/[slug]">) {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Memuat...</p>}>
      <Editor params={props.params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/roadmap/[slug]">["params"] }) {
  const { slug } = await params;
  await requireAdmin(`/admin/roadmap/${slug}`);
  const db = await createClient();

  const { data: track } = await db
    .from("tracks")
    .select("id, slug, title, description, status, track_nodes(id, position, optional, status, topics(slug, title, status))")
    .eq("slug", slug)
    .maybeSingle();
  if (!track) notFound();

  const nodes = (track.track_nodes as unknown as Node[]).toSorted((a, b) => a.position - b.position);
  const [{ data: edgeRows }, { data: topics }] = await Promise.all([
    db.from("track_edges").select("id, from_node_id, to_node_id, status").in("from_node_id", nodes.map((n) => n.id)),
    db.from("topics").select("id, slug, title, status").order("title"),
  ]);
  const edges = (edgeRows ?? []) as Edge[];
  const title = new Map(nodes.map((n) => [n.id, n.topics.title]));
  const used = new Set(nodes.map((n) => n.topics.slug));
  const hasDraft = [...nodes, ...edges].some((r) => r.status === "draft");
  const graphEdges = edges.map((e) => ({ from: e.from_node_id, to: e.to_node_id }));
  const placed = layout(
    nodes.map((n) => ({ id: n.id, topicId: "", slug: n.topics.slug, title: n.topics.title, summary: "", optional: n.optional, position: n.position, practiceCount: 0, cardCount: 0, hasExam: false })),
    graphEdges
  );
  const hidden = <input type="hidden" name="track" value={slug} />;

  return (
    <div className="grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
        <Link href="/admin/roadmap" className="text-sm text-zinc-400 hover:text-zinc-50">Semua roadmap</Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{track.title}</h1>
          <p className="mt-1 flex items-center gap-3 font-mono text-xs text-zinc-500">
            {slug} <StatusBadge status={track.status} />
          </p>
          {track.status === "published" && (
            <Link href={`/roadmap/${slug}`} className="mt-2 inline-block text-sm text-accent hover:underline">Lihat halaman publik</Link>
          )}
        </div>
        <TrackActions slug={slug} published={track.status === "published"} hasDraft={hasDraft} />
        <p className="text-xs leading-relaxed text-zinc-500">
          Topik dan prasyarat baru tampil di publik setelah diterbitkan. Hapus langsung berlaku.
        </p>
      </aside>

      <div className="flex min-w-0 flex-col gap-12">
        <section aria-labelledby="info">
          <h2 id="info" className="text-lg font-semibold">Info track</h2>
          <ActionForm action={simpanTrack} className="mt-4 grid gap-3">
            {hidden}
            <input name="title" defaultValue={track.title} aria-label="Judul" required className={field} />
            <textarea name="description" defaultValue={track.description} aria-label="Deskripsi" rows={2} className={field} />
            <button className={`${smallButton} justify-self-start`}>Simpan info</button>
          </ActionForm>
        </section>

        {placed.length > 0 && (
          <section aria-labelledby="pratinjau">
            <h2 id="pratinjau" className="text-lg font-semibold">Pratinjau</h2>
            <div className="mt-4 rounded-2xl border border-zinc-800/80 p-6">
              <RoadmapGraph nodes={placed} edges={graphEdges} states={{}} selected={null} />
            </div>
          </section>
        )}

        <section aria-labelledby="topik">
          <h2 id="topik" className="text-lg font-semibold">Topik <span className="text-zinc-500">{nodes.length}</span></h2>
          <p className="mt-1 text-sm text-zinc-500">Urutan menentukan posisi atas ke bawah dalam satu kolom.</p>
          <ul className="mt-4 divide-y divide-zinc-800/80 border-y border-zinc-800/80">
            {nodes.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{n.topics.title}</span>
                  <span className="flex gap-3 text-xs">
                    <StatusBadge status={n.status} />
                    {n.topics.status !== "published" && <span className="text-red-500">topik belum terbit</span>}
                  </span>
                </span>
                <ActionForm action={simpanNode} className="flex flex-wrap items-center gap-2">
                  {hidden}
                  <input type="hidden" name="id" value={n.id} />
                  <input name="position" type="number" min={0} defaultValue={n.position} aria-label={`Urutan ${n.topics.title}`} className={`${field} max-w-20`} />
                  <label className="flex min-h-11 items-center gap-2 px-1 text-sm text-zinc-400">
                    <input type="checkbox" name="optional" defaultChecked={n.optional} className="size-4 accent-(--accent)" />
                    Opsional
                  </label>
                  <button className={smallButton}>Simpan</button>
                </ActionForm>
                <ActionForm action={hapus}>
                  {hidden}
                  <input type="hidden" name="table" value="track_nodes" />
                  <input type="hidden" name="id" value={n.id} />
                  <button aria-label={`Hapus ${n.topics.title}`} className={`${smallButton} text-red-500`}>Hapus</button>
                </ActionForm>
              </li>
            ))}
          </ul>
          <ActionForm action={tambahNode} className="mt-4 flex flex-wrap gap-2">
            {hidden}
            <select name="topic_id" required aria-label="Topik" className={`${field} w-auto flex-1`}>
              {(topics ?? []).filter((t) => !used.has(t.slug)).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}{t.status !== "published" ? " (draf)" : ""}
                </option>
              ))}
            </select>
            <button className={primaryButton}>Tambah topik</button>
          </ActionForm>
        </section>

        {nodes.length > 1 && (
          <section aria-labelledby="prasyarat">
            <h2 id="prasyarat" className="text-lg font-semibold">Prasyarat <span className="text-zinc-500">{edges.length}</span></h2>
            <p className="mt-1 text-sm text-zinc-500">Saran urutan, bukan kunci. Lingkaran ditolak.</p>
            <ul className="mt-4 divide-y divide-zinc-800/80 border-y border-zinc-800/80">
              {edges.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1 text-sm">
                    {title.get(e.from_node_id)} <span className="text-zinc-500">sebelum</span> {title.get(e.to_node_id)}
                  </span>
                  <StatusBadge status={e.status} />
                  <ActionForm action={hapus}>
                    {hidden}
                    <input type="hidden" name="table" value="track_edges" />
                    <input type="hidden" name="id" value={e.id} />
                    <button className={`${smallButton} text-red-500`}>Hapus</button>
                  </ActionForm>
                </li>
              ))}
            </ul>
            <ActionForm action={tambahEdge} className="mt-4 flex flex-wrap items-center gap-2">
              {hidden}
              <select name="from" required aria-label="Prasyarat" className={`${field} w-auto flex-1`}>
                {nodes.map((n) => <option key={n.id} value={n.id}>{n.topics.title}</option>)}
              </select>
              <span className="text-sm text-zinc-500">sebelum</span>
              <select name="to" required aria-label="Topik lanjutan" className={`${field} w-auto flex-1`}>
                {nodes.map((n) => <option key={n.id} value={n.id}>{n.topics.title}</option>)}
              </select>
              <button className={primaryButton}>Tambah</button>
            </ActionForm>
          </section>
        )}
      </div>
    </div>
  );
}
