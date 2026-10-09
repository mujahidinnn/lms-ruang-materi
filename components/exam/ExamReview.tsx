import { Check, X } from "lucide-react";
import Link from "next/link";

export type Review = {
  score: number;
  passed: boolean;
  pass_score: number;
  show_keys: boolean;
  questions: { prompt: string; code: string | null; options: string[]; chosen: number | null; answer: number | null; explanation: string }[];
};

// Never "Gagal": a failed result says "Belum lulus" and points back to the
// material. The key shows only when the database decided it may.
export default function ExamReview({ review, slug }: { review: Review; slug: string }) {
  return (
    <div>
      <p className={`text-sm font-medium ${review.passed ? "text-accent" : "text-zinc-400"}`}>{review.passed ? "Lulus" : "Belum lulus"}</p>
      <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums">{review.score}</p>
      <p className="mt-2 text-zinc-400">Nilai lulus {review.pass_score}.</p>
      {!review.passed && (
        <p className="mt-4 text-zinc-300">
          Pelajari lagi <Link href={`/belajar/${slug}`} className="text-accent hover:underline">materinya</Link> dan ulangi{" "}
          <Link href={`/latihan/${slug}`} className="text-accent hover:underline">latihannya</Link>, lalu coba lagi.
        </p>
      )}
      {!review.show_keys && (
        <p className="mt-4 text-sm text-zinc-500">Kunci jawaban tampil setelah kamu lulus atau setelah percobaan terakhir.</p>
      )}

      <ol className="mt-10 divide-y divide-zinc-800/80 border-y border-zinc-800/80">
        {review.questions.map((q, n) => (
          <li key={n} className="py-6">
            <p className="text-xs text-zinc-500">Soal {n + 1}</p>
            <p className="mt-1 font-medium">{q.prompt}</p>
            {q.code && (
              <pre className="scrollbar-thin mt-3 overflow-x-auto rounded-lg border border-zinc-800/80 bg-zinc-900 p-3 text-sm"><code className="font-mono">{q.code}</code></pre>
            )}
            <ul className="mt-3 space-y-1 text-sm">
              {q.options.map((opt, i) => {
                const key = q.answer === i;
                const wrong = q.answer !== null && q.chosen === i && !key;
                return (
                  <li key={i} className={`flex items-center gap-2 ${key ? "text-accent" : wrong ? "text-red-500" : "text-zinc-400"}`}>
                    {key ? <Check aria-label="kunci" className="size-4" /> : wrong ? <X aria-label="salah" className="size-4" /> : <span className="size-4" />}
                    <span>{opt}</span>
                    {q.chosen === i && <span className="text-xs text-zinc-500">(jawabanmu)</span>}
                  </li>
                );
              })}
            </ul>
            {q.chosen === null && <p className="mt-2 text-sm text-zinc-500">Tidak dijawab.</p>}
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{q.explanation}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
