import { Check, X } from "lucide-react";
import LaporBab from "@/components/belajar/LaporBab";
import { Passed, TryAgain } from "@/components/illustrations";

export type Review = {
  score: number;
  passed: boolean;
  pass_score: number;
  show_keys: boolean;
  questions: { id: string; prompt: string; code: string | null; options: string[]; chosen: number | null; answer: number | null; explanation: string }[];
};

// Never "Gagal": a failed result says "Belum lulus" and points back to the
// material. The key shows only when the database decided it may. The page
// adds the Celebrate island for a pass.
export default function ExamReview({ review, slug, children }: { review: Review; slug: string; children?: React.ReactNode }) {
  return (
    <div>
      {review.passed ? <Passed className="mb-3 size-14 sm:mb-6 sm:size-20" /> : <TryAgain className="mb-3 size-14 sm:mb-6 sm:size-20" />}
      <p className={`inline-flex min-h-8 items-center rounded-full px-3 text-sm font-semibold ${review.passed ? "bg-tile-mint" : "bg-tile-pink"}`}>{review.passed ? "Lulus" : "Belum lulus"}</p>
      <p className="mt-1 text-5xl font-bold sm:text-6xl tracking-tight tabular-nums">{review.score}</p>
      <p className="mt-2 text-zinc-400">Nilai minimum {review.pass_score}.</p>
      {!review.passed && (
        <p className="mt-4 text-zinc-300">
          Pelajari lagi <a href={`/belajar/${slug}`} className="text-accent hover:underline">materinya</a> dan ulangi{" "}
          <a href={`/latihan/${slug}`} className="text-accent hover:underline">latihannya</a>, lalu coba lagi.
        </p>
      )}
      {!review.show_keys && (
        <p className="mt-4 text-sm text-zinc-500">Kunci jawaban tampil setelah kamu lulus atau setelah percobaan terakhir.</p>
      )}
      {children}

      <ol className="mt-6 space-y-3 sm:mt-10">
        {review.questions.map((q, n) => (
          <li key={n} className="rounded-2xl bg-zinc-900 p-5 shadow-soft sm:rounded-2xl sm:p-6">
            <p className="text-xs text-zinc-500">Soal {n + 1}</p>
            <p className="mt-1 text-lg font-semibold [overflow-wrap:anywhere]">{q.prompt}</p>
            {q.code && (
              <pre className="scrollbar-thin mt-3 overflow-x-auto rounded-xl bg-zinc-800/60 p-4 text-sm"><code className="font-mono">{q.code}</code></pre>
            )}
            <ul className="mt-3 space-y-1 text-sm">
              {q.options.map((opt, i) => {
                const key = q.answer === i;
                const wrong = q.answer !== null && q.chosen === i && !key;
                return (
                  <li key={i} className={`flex items-start gap-2 ${key ? "text-accent" : wrong ? "text-red-500" : "text-zinc-400"}`}>
                    {key ? <Check aria-label="kunci" className="mt-0.5 size-4 shrink-0" /> : wrong ? <X aria-label="salah" className="mt-0.5 size-4 shrink-0" /> : <span className="size-4 shrink-0" />}
                    <span className="min-w-0 [overflow-wrap:anywhere]"><span aria-hidden className="mr-1.5 font-semibold">{"ABCD"[i]}.</span>{opt}</span>
                    {q.chosen === i && <span className="text-xs text-zinc-500">(jawabanmu)</span>}
                  </li>
                );
              })}
            </ul>
            {q.chosen === null && <p className="mt-2 text-sm text-zinc-500">Tidak dijawab.</p>}
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{q.explanation}</p>
            <LaporBab questionId={q.id} className="mt-3 bg-zinc-800/60 px-4" />
          </li>
        ))}
      </ol>
    </div>
  );
}
