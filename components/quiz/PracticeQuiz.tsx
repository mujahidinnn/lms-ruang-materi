"use client";

import { Check, ClipboardCheck, Layers, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { simpanLatihan } from "@/app/latihan/actions";
import type { Question } from "@/lib/content";
import { shuffleOptions } from "@/lib/quiz";
import { primaryButton } from "@/components/ui/styles";

const HINT_KEY = "ruang-materi:hint-masuk";

// Untimed, instant feedback, not graded. 1 to 4 pick an option, Enter checks
// and moves on. A finished set is saved for signed-in learners only.
export default function PracticeQuiz({ topicId, slug, questions: raw, hasExam }: { topicId: string; slug: string; questions: Question[]; hasExam: boolean }) {
  const questions = useMemo(() => raw.map(shuffleOptions), [raw]);
  const [set, setSet] = useState(questions);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [wrong, setWrong] = useState<Question[]>([]);
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState(false);

  const q = set[i];
  const last = i === set.length - 1;

  function check() {
    if (picked === null || checked) return;
    setChecked(true);
    if (picked !== q.answer) setWrong((w) => [...w, q]);
  }

  async function next() {
    if (!last) {
      setI(i + 1);
      setPicked(null);
      setChecked(false);
      return;
    }
    setDone(true);
    const wrongCount = wrong.length;
    const { saved } = await simpanLatihan(topicId, set.length - wrongCount, set.length);
    try {
      if (!saved && !localStorage.getItem(HINT_KEY)) {
        localStorage.setItem(HINT_KEY, "1");
        setHint(true);
      }
    } catch {}
  }

  function restart(qs: Question[]) {
    setSet(qs);
    setI(0);
    setPicked(null);
    setChecked(false);
    setWrong([]);
    setDone(false);
  }

  useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("a, button") && e.key === "Enter") return;
      const n = Number(e.key);
      if (!checked && n >= 1 && n <= q.options.length) setPicked(n - 1);
      if (e.key !== "Enter") return;
      if (checked) next();
      else check();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (done) {
    const correct = set.length - wrong.length;
    return (
      <div aria-live="polite" className="py-6">
        <p className="text-4xl font-semibold tracking-tight tabular-nums">
          {correct} dari {set.length} benar
        </p>
        <p className="mt-2 text-zinc-400">
          {wrong.length === 0 ? "Semua benar. Kamu siap lanjut." : "Ulangi yang salah sampai semuanya kamu pahami."}
        </p>
        {hint && (
          <p className="mt-4 text-sm text-zinc-400">
            <Link href={`/masuk?next=/latihan/${slug}`} className="text-accent hover:underline">Masuk untuk menyimpan progres</Link>
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {hasExam ? (
            <>
              <Link href={`/ujian/${slug}`} className={primaryButton}><ClipboardCheck aria-hidden className="size-4" />Coba ujian</Link>
              {wrong.length > 0 && (
                <button onClick={() => restart(wrong)} className="min-h-11 text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent">
                  Ulangi yang salah
                </button>
              )}
            </>
          ) : wrong.length > 0 ? (
            <button onClick={() => restart(wrong)} className={primaryButton}><RotateCcw aria-hidden className="size-4" />Ulangi yang salah</button>
          ) : (
            <Link href={`/flashcard/${slug}`} className={primaryButton}><Layers aria-hidden className="size-4" />Lanjut ke flashcard</Link>
          )}
          <button onClick={() => restart(questions)} className="min-h-11 text-zinc-400 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent">
            Ulangi semua soal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm text-zinc-400 tabular-nums">
        <span>Soal {i + 1} dari {set.length}</span>
      </div>
      <div aria-hidden className="mt-2 h-1 rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${((i + (checked ? 1 : 0)) / set.length) * 100}%` }} />
      </div>

      <h2 className="mt-8 text-xl leading-snug font-semibold text-balance">{q.prompt}</h2>
      {q.code && (
        <pre className="scrollbar-thin mt-4 overflow-x-auto rounded-lg border border-zinc-800/80 bg-zinc-900 p-4 text-sm"><code className="font-mono">{q.code}</code></pre>
      )}

      <div role="radiogroup" aria-label="Pilihan jawaban" className="mt-6 grid gap-2">
        {q.options.map((opt, n) => {
          const isAnswer = checked && n === q.answer;
          const isWrong = checked && n === picked && n !== q.answer;
          return (
            <button
              key={n}
              role="radio"
              aria-checked={picked === n}
              disabled={checked}
              onClick={() => setPicked(n)}
              className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                isAnswer
                  ? "border-accent bg-accent/10"
                  : isWrong
                    ? "border-red-500/60 bg-red-500/10"
                    : picked === n
                      ? "border-zinc-400 bg-zinc-900"
                      : "border-zinc-800 hover:border-zinc-600 disabled:hover:border-zinc-800"
              }`}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-md border border-zinc-700 font-mono text-xs text-zinc-400">{n + 1}</span>
              <span className="flex-1">{opt}</span>
              {isAnswer && <Check aria-label="benar" className="size-5 text-accent" />}
              {isWrong && <X aria-label="salah" className="size-5 text-red-500" />}
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {checked && (
          <div className="mt-6 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4">
            <p className={`font-medium ${picked === q.answer ? "text-accent" : "text-red-500"}`}>
              {picked === q.answer ? "Benar" : "Belum tepat"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-300">{q.explanation}</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        {checked ? (
          <button onClick={next} className={primaryButton}>{last ? "Lihat hasil" : "Soal berikutnya"}</button>
        ) : (
          <button onClick={check} disabled={picked === null} className={primaryButton}><Check aria-hidden className="size-4" />Periksa jawaban</button>
        )}
      </div>
    </div>
  );
}
