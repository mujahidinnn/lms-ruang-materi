"use client";

import { Check, PartyPopper, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import CodeExercise from "@/components/code/CodeExercise";
import { primaryButton, secondaryButton, tile } from "@/components/ui/styles";
import { quizDone } from "@/lib/chapters";
import {
  burstFrom,
  celebrate,
  playCorrect,
  playWin,
  playWrong,
} from "@/lib/feedback";
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
  prompts?: ReactNode[];
}) {
  const questions = useMemo(() => raw.map(shuffleOptions), [raw]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<
    "idle" | "saved" | "guest" | "error" | "blocked"
  >("idle");
  const [blocked, setBlocked] = useState("");
  const [passedEx, setPassedEx] = useState<ReadonlySet<string>>(new Set());
  const allPassed = exercises.every((e) => passedEx.has(e.id));

  useEffect(() => {
    // Record the chapter as the resume point; guests make no request.
    const db = createClient();
    db.auth
      .getSession()
      .then(
        ({ data }) =>
          data.session &&
          db.rpc("open_chapter", { p_chapter: chapterId }).then(),
      );
  }, [chapterId]);

  async function complete() {
    const db = createClient();
    const { data } = await db.auth.getSession();
    if (!data.session) return setStatus("guest");
    const { error } = await db.rpc("complete_chapter", {
      p_chapter: chapterId,
    });
    if (error && error.hint !== "consent" && error.code === "P0001") {
      setBlocked(error.message);
      return setStatus("blocked");
    }
    setStatus(error ? "error" : "saved");
  }

  const finished = quizDone(questions, answers);

  // The last exercise to pass completes a chapter whose quiz is already done.
  function exercisePassed(id: string) {
    if (passedEx.has(id)) return;
    const next = new Set(passedEx).add(id);
    setPassedEx(next);
    if (
      finished &&
      exercises.every((e) => next.has(e.id)) &&
      status !== "saved"
    )
      complete();
  }

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
      if (allPassed && status !== "saved") complete();
    }
  }

  return (
    <>
      {exercises.map((ex, i) => (
        <CodeExercise
          key={ex.id}
          ex={ex}
          prompt={prompts[i]}
          slug={slug}
          onPassed={exercisePassed}
        />
      ))}
      <section
        aria-labelledby="kuis"
        className="mt-12 rounded-[28px] bg-zinc-800/50 p-5 sm:p-8"
      >
        <h2 id="kuis" className="text-2xl font-bold tracking-tight">
          Cek pemahaman
        </h2>
        {questions.length === 0 ? (
          <button
            type="button"
            onClick={() => {
              playWin();
              celebrate();
              complete();
            }}
            disabled={status === "saved" || !allPassed}
            className={`${primaryButton} mt-5`}
          >
            <Check aria-hidden className="size-4" />
            Tandai bab selesai
          </button>
        ) : (
          <ol className="mt-5 space-y-6">
            {questions.map((q, qi) => {
              const picked = answers[q.id];
              return (
                <li key={q.id}>
                  <p className="font-semibold">
                    {qi + 1}. {q.prompt}
                  </p>
                  {q.code && (
                    <pre className="scrollbar-thin mt-3 overflow-x-auto rounded-2xl bg-zinc-900 p-4 text-sm">
                      <code className="font-mono">{q.code}</code>
                    </pre>
                  )}
                  <div
                    role="group"
                    aria-label={`Pilihan jawaban soal ${qi + 1}`}
                    className="mt-3 grid gap-2"
                  >
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
                          className={`flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2 text-left shadow-soft focus-visible:outline-2 focus-visible:outline-accent ${right ? "bg-tile-mint" : wrong ? "bg-tile-pink" : "bg-zinc-900 hover:bg-zinc-800"}`}
                        >
                          <span
                            className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${tile(n)}`}
                          >
                            {n + 1}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {right && (
                            <Check aria-label="benar" className="size-5" />
                          )}
                          {wrong && <X aria-label="salah" className="size-5" />}
                        </button>
                      );
                    })}
                  </div>
                  {picked !== undefined && (
                    <p className="mt-2 text-sm text-zinc-300">
                      {q.explanation}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        <div aria-live="polite" className="mt-5 empty:hidden">
          {exercises.length > 0 &&
            !allPassed &&
            (finished || questions.length === 0) && (
              <p className="rounded-2xl bg-tile-butter px-4 py-3 text-sm">
                Selesaikan latihan kode di atas untuk menyelesaikan bab ini.
              </p>
            )}
          {status === "blocked" && (
            <p className="rounded-2xl bg-tile-butter px-4 py-3 text-sm">
              {blocked}
            </p>
          )}
          {((finished && allPassed) || status === "saved") && (
            <p className="flex items-center gap-2 rounded-2xl bg-tile-mint px-4 py-3 font-semibold">
              <PartyPopper aria-hidden className="size-5" />
              Bab selesai
            </p>
          )}
          {status === "guest" && (
            <p className="mt-2 text-sm text-zinc-400">
              <Link
                href={`/masuk?next=/belajar/${slug}`}
                className="text-accent underline"
              >
                Masuk untuk menyimpan progres
              </Link>
            </p>
          )}
          {status === "error" && (
            <p className="mt-2 text-sm text-zinc-400">
              Progres belum tersimpan.{" "}
              <Link href="/profil" className="text-accent underline">
                Cek persetujuan di Profil
              </Link>
              , lalu{" "}
              <button
                type="button"
                onClick={complete}
                className={secondaryButton}
              >
                coba lagi
              </button>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
