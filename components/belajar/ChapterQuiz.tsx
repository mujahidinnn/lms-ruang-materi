"use client";

import { Check, PartyPopper, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import CodeExercise from "@/components/code/CodeExercise";
import { primaryButton, secondaryButton } from "@/components/ui/styles";
import { quizDone } from "@/lib/chapters";
import { burstFrom, celebrate, playCorrect, playWin, playWrong } from "@/lib/feedback";
import type { ChapterQuestion, CodeExerciseData } from "@/lib/content";
import { shuffleOptions } from "@/lib/quiz";
import { keepChapter } from "@/lib/pending";
import { createClient } from "@/lib/supabase/client";
import SimpanProgres from "./SimpanProgres";

// Code exercises, then the quiz. Instant feedback, retry allowed. The quiz
// all correct (or the button, for a chapter without questions) plus every
// exercise passed completes the chapter for a signed-in learner.
export default function ChapterQuiz({
  chapterId,
  questions: raw,
  exercises = [],
  prompts = [],
}: {
  chapterId: string;
  questions: ChapterQuestion[];
  exercises?: CodeExerciseData[];
  // Exercise prompts as HTML, rendered on the server (ChapterMarkdown).
  prompts?: string[];
}) {
  const questions = useMemo(() => raw.map(shuffleOptions), [raw]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  // Wrong answers per question, counted for Lihat pembahasan and the
  // first-try summary; Coba lagi opens every option again.
  const [tried, setTried] = useState<Record<string, number[]>>({});
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
    if (!data.session) {
      keepChapter(chapterId);
      return setStatus("guest");
    }
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
  // Tells the chapter page's next link not to ask "skip the quiz?".
  const tuntas = (finished && allPassed) || status === "saved";
  useEffect(() => {
    if (tuntas) document.documentElement.dataset.babTuntas = "";
  }, [tuntas]);

  // The answer that makes the quiz all-correct completes the chapter. An
  // answered question is locked; a wrong one opens again only via Coba lagi.
  function pick(id: string, n: number, el: HTMLElement) {
    if (answers[id] !== undefined) return;
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
        <CodeExercise key={ex.id} ex={ex} prompt={<div dangerouslySetInnerHTML={{ __html: prompts[i] ?? "" }} />} onPassed={exercisePassed} />
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
                <li key={q.id} id={`soal-${qi + 1}`} className="scroll-mt-24">
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
                          aria-disabled={picked !== undefined}
                          onClick={(e) => pick(q.id, n, e.currentTarget)}
                          className={`flex min-h-12 items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent ${right ? "border-noir bg-tile-mint" : wrong ? "answer-shake border-noir bg-tile-pink" : picked !== undefined ? "cursor-default border-zinc-800 bg-zinc-900 opacity-50" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"}`}
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
                  {picked === q.answer && (
                    <p className="mt-3 rounded-2xl bg-matcha-50 px-4 py-3 text-sm leading-relaxed text-noir">
                      <strong>Tepat. </strong>{q.explanation}
                    </p>
                  )}
                  {/* Wrong: no explanation yet (it would give the answer away), just a retry. */}
                  {picked !== undefined && picked !== q.answer && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-tile-pink px-4 py-3 text-sm text-noir">
                      <p className="flex-1"><strong>Belum tepat.</strong> Baca lagi soalnya, lalu pilih jawaban lain.</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          const group = e.currentTarget.closest("li")?.querySelector<HTMLButtonElement>("[role=group] button");
                          setTried((t) => ({ ...t, [q.id]: [...(t[q.id] ?? []), picked] }));
                          setAnswers(({ [q.id]: _, ...rest }) => rest);
                          group?.focus();
                        }}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-noir bg-white px-4 font-semibold text-noir hover:bg-matcha-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        <RotateCcw aria-hidden className="size-4" />Coba lagi
                      </button>
                      {/* From the second wrong answer on, the explanation is one tap away. */}
                      {(tried[q.id]?.length ?? 0) >= 1 && (
                        <details className="w-full">
                          <summary className="min-h-11 cursor-pointer content-center font-semibold underline">Lihat pembahasan</summary>
                          <p className="mt-1 leading-relaxed">{q.explanation}</p>
                        </details>
                      )}
                    </div>
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
          {/* How it went: first-try score, and which questions are worth a re-read. */}
          {finished && (() => {
            const retried = questions.map((q, i) => (tried[q.id]?.length ? i + 1 : 0)).filter(Boolean);
            const first = questions.length - retried.length;
            return (
              <div className="mt-3 rounded-2xl bg-zinc-950 px-4 py-3 text-sm">
                <p className="font-semibold">{first} dari {questions.length} soal benar di percobaan pertama.</p>
                <p className="mt-1 text-zinc-400">
                  {retried.length === 0
                    ? "Semua langsung tepat. Materi bab ini sudah kamu kuasai."
                    : <>Soal {retried.map((n, i) => <span key={n}>{i > 0 && (i === retried.length - 1 ? " dan " : ", ")}<a href={`#soal-${n}`} className="text-accent underline">{n}</a></span>)} butuh lebih dari sekali coba. Baca lagi bagian materinya supaya makin paham.</>}
                </p>
              </div>
            );
          })()}
          {status === "guest" && <SimpanProgres text="Masuk, dan bab ini langsung tercatat selesai tanpa mengulang kuisnya." />}
          {status === "error" && (
            <p className="mt-2 text-sm text-zinc-400">Progres belum tersimpan. <a href="/profil" className="text-accent underline">Cek persetujuan di Profil</a>, lalu <button type="button" onClick={complete} className={secondaryButton}>coba lagi</button></p>
          )}
        </div>
      </section>
    </>
  );
}
