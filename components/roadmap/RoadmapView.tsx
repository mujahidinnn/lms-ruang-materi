"use client";

import { BookOpen, Check, ChevronRight, SkipForward, Undo2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { primaryButton } from "@/components/ui/styles";
import { createClient } from "@/lib/supabase/client";
import { layout, openPrerequisites, type NodeState, type RoadmapEdge, type RoadmapNode } from "@/lib/roadmap";
import RoadmapGraph from "./RoadmapGraph";
import StateIcon from "./StateIcon";

// Desktop: graph plus a side panel that holds the ordered list, or the
// picked node. Mobile: the list, with the node as a bottom sheet.
export default function RoadmapView({ nodes, edges }: { nodes: RoadmapNode[]; edges: RoadmapEdge[] }) {
  const placed = layout(nodes, edges);
  const [selected, setSelected] = useState<string | null>(null);
  const { states, scores, signedIn, mark, error } = useProgress(nodes);
  const core = placed.filter((n) => !n.optional);
  const coreDone = core.filter((n) => states[n.id] === "selesai").length;
  const node = placed.find((n) => n.id === selected);
  const heading = useRef<HTMLHeadingElement>(null);
  const lastPicked = useRef<string | null>(null);

  useEffect(() => {
    if (selected) heading.current?.focus();
    else if (lastPicked.current) document.getElementById(`node-${lastPicked.current}`)?.focus();
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  function pick(id: string) {
    lastPicked.current = id;
    setSelected(id);
  }

  const title = (id: string) => placed.find((n) => n.id === id)?.title;
  const open = node ? openPrerequisites(node.id, edges, states).map(title) : [];

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
      <div className="hidden lg:block">
        <RoadmapGraph nodes={placed} edges={edges} states={states} selected={selected} onSelect={pick} />
        <p aria-hidden className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500">
          {(["selesai", "sedang", "belum", "dilewati"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <StateIcon state={s} />
              {s}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded border border-dashed border-zinc-600" />
            opsional
          </span>
        </p>
      </div>

      <div>
        {signedIn && core.length > 0 && (
          <div className={`mb-5 ${node ? "lg:hidden" : ""}`}>
            <p className="text-sm text-zinc-400 tabular-nums">{coreDone} dari {core.length} topik inti selesai</p>
            <div aria-hidden className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(coreDone / core.length) * 100}%` }} />
            </div>
          </div>
        )}
        <ol className={`divide-y divide-zinc-800/80 border-y border-zinc-800/80 ${node ? "lg:hidden" : ""}`}>
          {placed.map((n) => {
            const state = states[n.id] ?? "belum";
            return (
              <li key={n.id}>
                <button
                  id={`node-${n.id}`}
                  type="button"
                  onClick={() => pick(n.id)}
                  className="flex min-h-12 w-full items-center gap-3 py-2 text-left hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <StateIcon state={state} />
                  <span className="min-w-0 flex-1 truncate font-medium">{n.title}</span>
                  <span className="sr-only">, {state}</span>
                  {n.optional && <span className="text-xs text-zinc-500">opsional</span>}
                  <ChevronRight aria-hidden className="size-4 text-zinc-600" />
                </button>
              </li>
            );
          })}
        </ol>

        {node && (
          <>
            <div aria-hidden className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSelected(null)} />
            <section
              aria-labelledby="node-title"
              className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-2xl border-t border-zinc-800 bg-zinc-950 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:static lg:z-auto lg:max-h-none lg:rounded-2xl lg:border lg:border-zinc-800/80 lg:bg-zinc-900/40"
            >
              <div className="flex items-start gap-3">
                <h2 id="node-title" ref={heading} tabIndex={-1} className="flex-1 text-xl font-semibold tracking-tight outline-none">
                  {node.title}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Tutup"
                  className="-mt-2 -mr-2 grid size-11 place-items-center rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <X aria-hidden className="size-5" />
                </button>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                <StateIcon state={states[node.id] ?? "belum"} />
                {states[node.id] ?? "belum"}
                {node.optional && <span className="text-zinc-500">, opsional</span>}
                {scores[node.topicId] !== undefined && <span className="ml-auto tabular-nums">Nilai ujian {scores[node.topicId]}</span>}
              </p>
              {open.length > 0 && (
                <p className="mt-4 text-sm text-zinc-400">Disarankan setelah {open.join(", ")}.</p>
              )}
              {node.summary && <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-zinc-300">{node.summary}</p>}
              <Link href={`/belajar/${node.slug}`} className={`${primaryButton} mt-6 w-full`}>
                <BookOpen aria-hidden className="size-4" />
                Belajar
              </Link>
              {node.hasExam && states[node.id] !== "selesai" && (
                <Link href={`/ujian/${node.slug}`} className="mt-3 block text-center text-sm text-accent hover:underline">
                  Sudah paham? Langsung ujian
                </Link>
              )}
              {(node.practiceCount > 0 || node.cardCount > 0) && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {node.practiceCount > 0 && (
                    <Link href={`/latihan/${node.slug}`} className="flex min-h-11 items-center justify-center rounded-lg border border-zinc-800 text-sm hover:border-zinc-600 focus-visible:outline-2 focus-visible:outline-accent">
                      Latihan
                    </Link>
                  )}
                  {node.cardCount > 0 && (
                    <Link href={`/flashcard/${node.slug}`} className="flex min-h-11 items-center justify-center rounded-lg border border-zinc-800 text-sm hover:border-zinc-600 focus-visible:outline-2 focus-visible:outline-accent">
                      Flashcard
                    </Link>
                  )}
                </div>
              )}
              {signedIn && (
                <div className="mt-4 flex flex-wrap gap-x-4 border-t border-zinc-800/80 pt-3 text-sm">
                  {!node.hasExam && states[node.id] !== "selesai" && (
                    <button type="button" onClick={() => mark(node, "selesai")} className="inline-flex min-h-11 items-center gap-2 text-zinc-300 hover:text-zinc-50">
                      <Check aria-hidden className="size-4" />Tandai selesai
                    </button>
                  )}
                  {states[node.id] === "dilewati" ? (
                    <button type="button" onClick={() => mark(node, "sedang")} className="inline-flex min-h-11 items-center gap-2 text-zinc-300 hover:text-zinc-50">
                      <Undo2 aria-hidden className="size-4" />Batal lewati
                    </button>
                  ) : (
                    states[node.id] !== "selesai" && (
                      <button type="button" onClick={() => mark(node, "dilewati")} className="inline-flex min-h-11 items-center gap-2 text-zinc-400 hover:text-zinc-50">
                        <SkipForward aria-hidden className="size-4" />Lewati
                      </button>
                    )
                  )}
                  <p aria-live="polite" className="w-full text-red-500 empty:hidden">{error}</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

// The signed-in learner's state and best exam score per node, read with
// their own session. Logged out every node stays "belum". mark() sets
// selesai or dilewati through touch_progress(); the database refuses
// selesai on a topic that has an exam.
function useProgress(nodes: RoadmapNode[]) {
  const [states, setStates] = useState<Record<string, NodeState>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const db = createClient();
    db.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const uid = data.session.user.id;
      const topics = nodes.map((n) => n.topicId);
      const [{ data: rows }, { data: attempts }] = await Promise.all([
        db.from("progress").select("topic_id, state").eq("user_id", uid).in("topic_id", topics),
        db.from("exam_attempts").select("score, exams(topic_id)").eq("user_id", uid).not("score", "is", null),
      ]);
      const byTopic = new Map((rows ?? []).map((r) => [r.topic_id as string, r.state as NodeState]));
      const best: Record<string, number> = {};
      for (const a of (attempts ?? []) as unknown as { score: number; exams: { topic_id: string } | null }[]) {
        if (a.exams) best[a.exams.topic_id] = Math.max(best[a.exams.topic_id] ?? 0, a.score);
      }
      setSignedIn(true);
      setScores(best);
      setStates(Object.fromEntries(nodes.flatMap((n) => (byTopic.has(n.topicId) ? [[n.id, byTopic.get(n.topicId)!]] : []))));
    });
  }, [nodes]);

  async function mark(node: RoadmapNode, state: NodeState) {
    setError("");
    const { error } = await createClient().rpc("touch_progress", { p_topic: node.topicId, p_state: state });
    if (error) return setError(error.code === "P0001" ? error.message : "Gagal menyimpan, coba lagi.");
    setStates((s) => ({ ...s, [node.id]: state }));
  }

  return { states, scores, signedIn, mark, error };
}
