"use client";

import { Check, PartyPopper, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import CodeExercise from "@/components/code/CodeExercise";
import { primaryButton, secondaryButton } from "@/components/ui/styles";
import { quizDone } from "@/lib/chapters";
import { burstFrom, celebrate, playCorrect, playWin, playWrong } from "@/lib/feedback";
import type { ChapterQuestion, CodeExerciseData } from "@/lib/content";
import { shuffleOptions } from "@/lib/quiz";
import { createClient } from "@/lib/supabase/client";

// Code exercises, then the quiz. Instant feedback, retry allowed. The quiz
// all correct (or the button, for a chapter without questions) plus every
// exercise passed completes the chapter for a signed-in learner.
export default function ChapterQuiz({
  chapterId,
  slug,
  questions: raw,
  exercises = [],
  prompts = [],
}: {
  chapterId: string;
  slug: string;
  questions: ChapterQuestion[];
  exercises?: CodeExerciseData[];
  // Exercise prompts as HTML, rendered on the server (ChapterMarkdown).
  prompts?: string[];
}) {
  const questions = useMemo(() => raw.map(shuffleOptions), [raw]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<"idle" | "saved" | "guest" | "error" | "blocked">("idle");
  const [blocked, setBlocked] = useState("");
  const [passedEx, setPassedEx] = useState<ReadonlySet<string>>(new Set());
  // Refs, not state, decide completion: exercise cards report passes from
  // async callbacks that may hold an old render's closure.
  const passed = useRef(new Set<string>());
  const quizOk = useRef(false);
  const completing = useRef(false);
  const allPassed = exercises.every((e) => passedEx.has(e.id));

  useEffect(() => {
    // Record the chapter as the resume point; guests make no request.
    const db = createClient();
    db.auth.getSession().then(({ data }) => data.session && db.rpc("open_chapter", { p_chapter: chapterId }).then());
  }, [chapterId]);

  async function complete() {
    completing.current = true;
    const db = createClient();
    const { data } = await db.auth.getSession();
    if (!data.session) return setStatus("guest");
    const { error } = await db.rpc("complete_chapter", { p_chapter: chapterId });
    if (error) completing.current = false;
    if (error && error.hint !== "consent" && error.code === "P0001") {
      setBlocked(error.message);
      return setStatus("blocked");
    }
    setStatus(error ? "error" : "saved");
    // The chapter list beside the article ticks this chapter off.
    if (!error) window.dispatchEvent(new CustomEvent("bab-selesai", { detail: chapterId }));
  }

  function tryComplete() {
    if (!completing.current && quizOk.current && exercises.every((e) => passed.current.has(e.id))) complete();
  }

  function exercisePassed(id: string) {
    if (passed.current.has(id)) return;
    passed.current.add(id);
    setPassedEx(new Set(passed.current));
    tryComplete();
  }

  const finished = quizDone(questions, answers);

  // The answer that makes the quiz all-correct completes the chapter.
  function pick(id: string, n: number, el: HTMLElement) {
    const next = { ...answers, [id]: n };
    setAnswers(next);
    const right = questions.find((x) => x.id === id)?.answer === n;
    if (right) {
      playCorrect();
      burstFrom(el);
    } else playWrong();
    if (!finished && quizDone(questions, next)) {
      playWin();
      celebrate();
      quizOk.current = true;
      tryComplete();
    }
  }

  return (
    <>
      {exercises.map((ex, i) => (
        <CodeExercise key={ex.id} ex={ex} prompt={<div dangerouslySetInnerHTML={{ __html: prompts[i] ?? "" }} />} slug={slug} onPassed={exercisePassed} />
      ))}
      <section aria-labelledby="kuis" className="mt-10 rounded-[28px] bg-zinc-900 p-5 shadow-soft sm:p-8">
        <h2 id="kuis" className="text-2xl font-bold tracking-tight">Cek pemahaman</h2>
        {questions.length === 0 ? (
          <button type="button" onClick={() => { playWin(); celebrate(); complete(); }} disabled={status === "saved" || !allPassed} className={`${primaryButton} mt-5`}>
            <Check aria-hidden className="size-4" />Tandai bab selesai
          </button>
        ) : (
          <ol className="mt-5 space-y-8">
            {questions.map((q, qi) => {
              const picked = answers[q.id];
              return (
                <li key={q.id}>
                  <p className="flex gap-3 font-semibold leading-snug">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-noir text-xs text-on-noir tabular-nums">{qi + 1}</span>
                    <span className="pt-0.5">{q.prompt}</span>
                  </p>
                  {q.code && <pre className="scrollbar-thin mt-3 overflow-x-auto rounded-2xl bg-zinc-950 p-4 text-sm"><code className="font-mono">{q.code}</code></pre>}
                  <div role="group" aria-label={`Pilihan jawaban soal ${qi + 1}`} className="mt-3 grid gap-2">
                    {q.options.map((opt, n) => {
                      const chosen = picked === n;
                      const right = chosen && n === q.answer;
                      const wrong = chosen && n !== q.answer;
                      return (
                        <button
                          key={n}
                          type="button"
                          aria-pressed={chosen}
                          onClick={(e) => pick(q.id, n, e.currentTarget)}
                          className={`flex min-h-12 items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent ${right ? "border-noir bg-tile-mint" : wrong ? "border-noir bg-tile-pink" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}
                        >
                          {/* Letters, all alike: color appears only once answered. */}
                          <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${right || wrong ? "bg-noir text-on-noir" : "bg-zinc-800 text-zinc-300"}`}>{"ABCD"[n]}</span>
                          <span className="flex-1">{opt}</span>
                          {right && <Check aria-label="benar" className="size-5" />}
                          {wrong && <X aria-label="salah" className="size-5" />}
                        </button>
                      );
                    })}
                  </div>
                  {picked !== undefined && (
                    <p className={`mt-3 rounded-2xl px-4 py-3 text-sm leading-relaxed ${picked === q.answer ? "bg-matcha-50 text-noir" : "bg-zinc-900 text-zinc-300"}`}>
                      <strong>{picked === q.answer ? "Tepat. " : "Belum tepat. "}</strong>{q.explanation}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        <div aria-live="polite" className="mt-5 empty:hidden">
          {exercises.length > 0 && !allPassed && (finished || questions.length === 0) && (
            <p className="rounded-2xl bg-tile-butter px-4 py-3 text-sm">Selesaikan latihan kode di atas untuk menyelesaikan bab ini.</p>
          )}
          {status === "blocked" && <p className="rounded-2xl bg-tile-butter px-4 py-3 text-sm">{blocked}</p>}
          {((finished && allPassed) || status === "saved") && (
            <p className="flex items-center gap-2 rounded-2xl bg-tile-mint px-4 py-3 font-semibold"><PartyPopper aria-hidden className="size-5" />Bab selesai</p>
          )}
          {status === "guest" && (
            <p className="mt-2 text-sm text-zinc-400"><a href={`/masuk?next=/belajar/${slug}`} className="text-accent underline">Masuk untuk menyimpan progres</a></p>
          )}
          {status === "error" && (
            <p className="mt-2 text-sm text-zinc-400">Progres belum tersimpan. <a href="/profil" className="text-accent underline">Cek persetujuan di Profil</a>, lalu <button type="button" onClick={complete} className={secondaryButton}>coba lagi</button></p>
          )}
        </div>
      </section>
    </>
  );
}
