"use client";

import { Check, Eye, Play, RotateCcw, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { EditorLanguage } from "@/components/code/CodeEditor";
import { useSandbox, type RunResult } from "@/components/code/useSandbox";
import { card, primaryButton, secondaryButton } from "@/components/ui/styles";
import type { ExerciseFiles } from "@/lib/code/sandbox-doc";
import type { CodeExerciseData } from "@/lib/content";
import { burstFrom, celebrate, playCorrect, playWrong } from "@/lib/feedback";
import { createClient } from "@/lib/supabase/client";

const CodeEditor = dynamic(() => import("@/components/code/CodeEditor"), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-2xl bg-zinc-950" />,
});

type Part = keyof ExerciseFiles;
const PARTS: Record<CodeExerciseData["kind"], Part[]> = { web: ["html", "css", "js"], js: ["code"], express: ["code"] };
const LANG: Record<Part, EditorLanguage> = { html: "html", css: "css", js: "javascript", code: "javascript" };
const LABEL: Record<Part, string> = { html: "HTML", css: "CSS", js: "JS", code: "Kode" };

function readDraft(key: string): ExerciseFiles | null {
  try {
    const saved = typeof window === "undefined" ? null : localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveDraft(key: string, files: ExerciseFiles | null) {
  try {
    if (files) localStorage.setItem(key, JSON.stringify(files));
    else localStorage.removeItem(key);
  } catch {}
}

// One exercise: prompt, editor, Jalankan (output only) and Periksa (checks).
// The draft stays in localStorage; a pass is recorded for signed-in learners.
export default function CodeExercise({ ex, prompt, slug, onPassed }: { ex: CodeExerciseData; prompt: ReactNode; slug: string; onPassed: (id: string) => void }) {
  const key = `ruang-materi:kode:${ex.id}`;
  const parts = PARTS[ex.kind];
  const [files, setFiles] = useState<ExerciseFiles>(() => readDraft(key) ?? ex.starter);
  // Bumped whenever files change from outside the editor, to remount it.
  const [version, setVersion] = useState(0);
  const [part, setPart] = useState<Part>(parts[0]);
  const [out, setOut] = useState<RunResult | null>(null);
  const [fails, setFails] = useState(0);
  const [passed, setPassed] = useState(false);
  const [note, setNote] = useState<"guest" | "error" | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLElement>(null);
  const { run } = useSandbox();

  useEffect(() => {
    // A returning learner who passed sees "Lolos" (and their code if no draft).
    const db = createClient();
    db.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: row } = await db.from("code_progress").select("code").eq("user_id", data.session.user.id).eq("exercise_id", ex.id).maybeSingle();
      if (!row) return;
      setPassed(true);
      onPassed(ex.id);
      if (!readDraft(key)) {
        setFiles(row.code as ExerciseFiles);
        setVersion((v) => v + 1);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.id]);

  function edit(p: Part, v: string) {
    const next = { ...files, [p]: v };
    setFiles(next);
    saveDraft(key, next);
  }

  function load(next: ExerciseFiles) {
    setFiles(next);
    setVersion((v) => v + 1);
    setPart(parts[0]);
  }

  async function go(withChecks: boolean) {
    setBusy(true);
    const r = await run({ kind: ex.kind, files, setup: ex.setup, tests: withChecks ? ex.tests : [], previewEl: ex.kind === "web" ? preview.current : null });
    setOut(r);
    setBusy(false);
    if (!withChecks) return;
    if (r.error || ex.tests.length === 0 || r.results.length !== ex.tests.length || !r.results.every((x) => x.pass)) {
      playWrong();
      setFails((f) => f + 1);
      return;
    }
    playCorrect();
    burstFrom(box.current);
    if (!passed) celebrate();
    setPassed(true);
    onPassed(ex.id);
    const db = createClient();
    const { data } = await db.auth.getSession();
    if (!data.session) return setNote("guest");
    const { error } = await db.rpc("pass_code_exercise", { p_exercise: ex.id, p_code: files });
    setNote(error ? "error" : null);
  }

  return (
    <section ref={box} aria-labelledby={`kode-${ex.id}`} className={`mt-10 p-5 sm:p-7 ${card}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`kode-${ex.id}`} className="text-2xl font-bold tracking-tight">Latihan kode: {ex.title}</h2>
        {passed && (
          <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-tile-mint px-3 text-sm font-semibold"><Check aria-hidden className="size-4" />Lolos</span>
        )}
      </div>
      <div className="mt-3">{prompt}</div>

      {parts.length > 1 && (
        <div role="tablist" aria-label="Berkas" className="mt-5 flex gap-2">
          {parts.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={part === p}
              onClick={() => setPart(p)}
              className={`min-h-10 rounded-full px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent ${part === p ? "bg-zinc-50 text-zinc-950" : "bg-zinc-800 text-zinc-300"}`}
            >
              {LABEL[p]}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3">
        <CodeEditor key={`${part}-${version}`} value={files[part] ?? ""} onChange={(v) => edit(part, v)} language={LANG[part]} label={`Editor ${LABEL[part]}`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => go(true)} disabled={busy} className={primaryButton}><Check aria-hidden className="size-4" />Periksa</button>
        <button type="button" onClick={() => go(false)} disabled={busy} className={secondaryButton}><Play aria-hidden className="size-4" />Jalankan</button>
        <button type="button" onClick={() => { load(ex.starter); saveDraft(key, null); }} className={secondaryButton}><RotateCcw aria-hidden className="size-4" />Reset kode</button>
        {fails >= 2 && (
          <button type="button" onClick={() => load(ex.solution)} className={secondaryButton}><Eye aria-hidden className="size-4" />Lihat solusi</button>
        )}
      </div>

      {ex.kind === "web" && (
        <iframe ref={preview} title={`Pratinjau ${ex.title}`} sandbox="allow-scripts" className="mt-4 h-64 w-full rounded-2xl border-0 bg-white" />
      )}

      <div aria-live="polite" className="mt-4 space-y-3 empty:hidden">
        {out?.error && (
          <p className="rounded-2xl bg-tile-pink px-4 py-3 text-sm"><span className="font-semibold">Galat:</span> {out.error}</p>
        )}
        {out && out.logs.length > 0 && (
          <pre className="scrollbar-thin max-h-48 overflow-auto rounded-2xl bg-zinc-950 p-4 text-sm"><code className="font-mono">{out.logs.join("\n")}</code></pre>
        )}
        {out && out.results.length > 0 && (
          <ul className="space-y-2">
            {out.results.map((r) => (
              <li key={r.name} className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm ${r.pass ? "bg-tile-mint" : "bg-tile-pink"}`}>
                {r.pass ? <Check aria-label="lolos" className="mt-0.5 size-4 shrink-0" /> : <X aria-label="gagal" className="mt-0.5 size-4 shrink-0" />}
                <span>
                  <span className="font-medium">{r.name}</span>
                  {r.error && <span className="block text-zinc-300">{r.error}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
        {note === "guest" && (
          <p className="text-sm text-zinc-400"><Link href={`/masuk?next=/belajar/${slug}`} className="text-accent underline">Masuk untuk menyimpan progres</Link></p>
        )}
        {note === "error" && (
          <p className="text-sm text-zinc-400">Lolos, tapi belum tersimpan. <Link href="/profil" className="text-accent underline">Cek persetujuan di Profil</Link>, lalu periksa lagi.</p>
        )}
      </div>
    </section>
  );
}
