"use client";

import { Check, ClipboardCheck, Layers, PartyPopper, Play, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import SoundToggle from "@/components/quiz/SoundToggle";
import { card, primaryButton, secondaryButton } from "@/components/ui/styles";
import type { Question } from "@/lib/content";
import { burstFrom, celebrate, playCorrect, playWin, playWrong } from "@/lib/feedback";
import { sampleQuestions, setResult, shuffleOptions } from "@/lib/quiz";
import SimpanProgres from "@/components/belajar/SimpanProgres";
import { keepPractice } from "@/lib/pending";
import { rpc } from "@/lib/rpc";

const simpanLatihan = rpc("simpanLatihan");


export type Prep = { passScore: number; size: number };

// Untimed and instant: tapping an option (or pressing 1 to 4) locks it in
// and shows the key and the explanation at once; Enter moves on. With
// `prep`, a random set of `size` questions from the pool is scored against
// the exam's pass score. A finished set is saved for signed-in learners.
export default function PracticeQuiz({
  topicId,
  slug,
  questions: raw,
  hasExam,
  prep,
}: {
  topicId: string;
  slug: string;
  questions: Question[];
  hasExam: boolean;
  prep?: Prep;
}) {
  const questions = useMemo(() => raw.map(shuffleOptions), [raw]);
  const [set, setSet] = useState<Question[]>(prep ? [] : questions);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<Question[]>([]);
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState(false);
  const [consent, setConsent] = useState(false);
  const options = useRef<(HTMLButtonElement | null)[]>([]);

  const q = set[i];
  const last = i === set.length - 1;
  const checked = picked !== null;

  function answer(n: number) {
    if (checked || !q) return;
    setPicked(n);
    if (n === q.answer) {
      playCorrect();
      burstFrom(options.current[n]);
    } else {
      playWrong();
      setWrong((w) => [...w, q]);
    }
  }

  async function next() {
    if (!last) {
      setI(i + 1);
      setPicked(null);
      return;
    }
    setDone(true);
    const correct = set.length - wrong.length;
    if (setResult(correct, set.length, prep?.passScore).win) {
      playWin();
      celebrate();
    }
    const { saved, needsConsent } = await simpanLatihan(topicId, correct, set.length);
    if (needsConsent) return setConsent(true);
    // A guest's result waits in this browser until they sign in.
    if (!saved) {
      keepPractice({ topicId, correct, total: set.length });
      setHint(true);
    }
  }

  function restart(qs: Question[]) {
    setSet(qs);
    setI(0);
    setPicked(null);
    setWrong([]);
    setDone(false);
  }

  // Exam prep draws a fresh random set on every start (an event, so random is fine).
  const startPrep = () => prep && restart(sampleQuestions(questions, prep.size, Math.random));

  useEffect(() => {
    if (done || !q) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("a, button:not([data-option])") && e.key === "Enter") return;
      const n = Number(e.key);
      if (!checked && n >= 1 && n <= q.options.length) answer(n - 1);
      if (e.key === "Enter" && checked) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (prep && set.length === 0) {
    return (
      <div className="rounded-[32px] bg-tile-butter p-6 sm:p-8">
        <p className="text-2xl font-bold tracking-tight">Try out sebelum ujian</p>
        <p className="mt-2 max-w-xl text-zinc-300">
          {Math.min(prep.size, questions.length)} soal acak dari latihan dan kuis tiap bab. Kunci dan pembahasan langsung muncul setelah kamu menjawab. Lulus di nilai {prep.passScore}, sama seperti ujian.
        </p>
        <button onClick={startPrep} className={`${primaryButton} mt-6`}><Play aria-hidden className="size-4" />Mulai try out</button>
      </div>
    );
  }

  if (done) {
    const correct = set.length - wrong.length;
    const { score, win } = setResult(correct, set.length, prep?.passScore);
    return (
      <div aria-live="polite" className={`rounded-[32px] p-6 sm:p-8 ${win ? "bg-tile-mint" : "bg-zinc-900 shadow-soft"}`}>
        {win && <PartyPopper aria-hidden className="size-10 text-accent-warm" />}
        <p className="mt-2 text-5xl font-bold tracking-tight tabular-nums">
          {prep ? `Nilai ${score}` : `${correct} dari ${set.length} benar`}
        </p>
        <p className="mt-2 text-zinc-300">
          {prep
            ? win
              ? `${correct} dari ${set.length} benar. Kamu siap untuk ujian.`
              : `${correct} dari ${set.length} benar. Lulus ujian butuh nilai ${prep.passScore}; ulangi yang salah dulu.`
            : wrong.length === 0
              ? "Semua benar. Kamu siap lanjut."
              : "Ulangi yang salah sampai semuanya kamu pahami."}
        </p>
        {consent && (
          <p className="mt-4 text-sm text-zinc-400">
            Hasil ini belum tersimpan.{" "}
            <a href="/profil" className="text-accent hover:underline">Konfirmasi persetujuan di Profil</a> agar progresmu tersimpan.
          </p>
        )}
        {hint && <SimpanProgres text="Masuk, dan hasil latihan ini langsung tercatat." />}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {hasExam && (prep ? win : wrong.length === 0) ? (
            <a href={`/ujian/${slug}`} className={primaryButton}><ClipboardCheck aria-hidden className="size-4" />Mulai ujian</a>
          ) : wrong.length > 0 ? (
            <button onClick={() => restart(wrong)} className={primaryButton}><RotateCcw aria-hidden className="size-4" />Ulangi yang salah</button>
          ) : (
            <a href={`/flashcard/${slug}`} className={primaryButton}><Layers aria-hidden className="size-4" />Lanjut ke flashcard</a>
          )}
          {hasExam && !prep && (
            <a href={`/latihan/${slug}/persiapan`} className={secondaryButton}>Try out</a>
          )}
          <button onClick={() => (prep ? startPrep() : restart(questions))} className={secondaryButton}>
            {prep ? "Try out baru" : "Ulangi semua soal"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm text-zinc-400 tabular-nums">
        <span>Soal {i + 1} dari {set.length}</span>
        <SoundToggle />
      </div>
      <div aria-hidden className="mt-2 h-2.5 rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${((i + (checked ? 1 : 0)) / set.length) * 100}%` }} />
      </div>

      <h2 className="mt-8 text-2xl leading-snug font-bold tracking-tight text-balance">{q.prompt}</h2>
      {q.code && (
        <pre className="scrollbar-thin mt-4 overflow-x-auto rounded-2xl bg-zinc-900 p-5 text-sm shadow-soft"><code className="font-mono">{q.code}</code></pre>
      )}

      <div role="group" aria-label="Pilihan jawaban" className="mt-6 grid gap-2">
        {q.options.map((opt, n) => {
          const isAnswer = checked && n === q.answer;
          const isWrong = checked && n === picked && n !== q.answer;
          return (
            <button
              key={n}
              ref={(el) => {
                options.current[n] = el;
              }}
              data-option
              aria-pressed={picked === n}
              disabled={checked}
              onClick={() => answer(n)}
              className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left shadow-soft transition-[background-color,transform] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none ${
                isAnswer
                  ? "answer-pop border-transparent bg-tile-mint"
                  : isWrong
                    ? "answer-shake border-transparent bg-tile-pink"
                    : "border-transparent bg-zinc-900 hover:border-zinc-700 disabled:opacity-60 disabled:hover:border-transparent"
              }`}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">{"ABCD"[n]}</span>
              <span className="flex-1">{opt}</span>
              {isAnswer && <Check aria-label="benar" className="size-5" />}
              {isWrong && <X aria-label="salah" className="size-5" />}
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {checked && (
          <div className={`mt-6 p-5 ${card}`}>
            <p className="font-semibold">{picked === q.answer ? "Benar" : `Belum tepat. Jawabannya: ${q.options[q.answer]}`}</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-300">{q.explanation}</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        {checked && <button onClick={next} className={primaryButton}>{last ? "Lihat hasil" : "Soal berikutnya"}</button>}
      </div>
    </div>
  );
}
