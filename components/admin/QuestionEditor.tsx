import { Check, Trash2 } from "lucide-react";
import { hapusBaris, simpanBaris } from "@/app/admin/topik/actions";
import StatusBadge from "./StatusBadge";
import { dangerButton, field, smallButton } from "./editor";

export type Question = {
  id: string;
  status: string;
  type: "pilihan_ganda" | "benar_salah" | "baca_kode";
  prompt: string;
  code: string | null;
  options: string[];
  answer: number;
  explanation: string;
};

const TYPE = { pilihan_ganda: "Pilihan ganda", benar_salah: "Benar atau salah", baca_kode: "Baca kode" };

export default function QuestionEditor({
  table,
  slug,
  q,
  n,
}: {
  table: "practice_questions" | "exam_questions";
  slug: string;
  q: Question;
  n: number;
}) {
  return (
    <li className="py-5">
      <div className="flex items-baseline justify-between gap-4 text-xs text-zinc-500">
        <span>{n}. {TYPE[q.type]}</span>
        <StatusBadge status={q.status} />
      </div>
      <p className="mt-2 text-zinc-50">{q.prompt}</p>
      {q.code && (
        <pre className="mt-2 overflow-x-auto rounded-md border border-zinc-800/80 bg-zinc-900 p-3 text-sm"><code className="font-mono">{q.code}</code></pre>
      )}
      <ol className="mt-3 space-y-1">
        {q.options.map((opt, i) => (
          <li key={i} className={`flex items-start gap-2 text-sm ${i === q.answer ? "text-accent" : "text-zinc-300"}`}>
            {i === q.answer ? <Check aria-label="Jawaban benar" className="mt-0.5 size-4 shrink-0" /> : <span aria-hidden className="w-4 shrink-0" />}
            {opt}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-zinc-400">{q.explanation}</p>

      <details className="mt-2">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm text-zinc-400 hover:text-zinc-50">Edit</summary>
        <form action={simpanBaris} className="mt-2 flex flex-col gap-3">
          <input type="hidden" name="table" value={table} />
          <input type="hidden" name="id" value={q.id} />
          <input type="hidden" name="slug" value={slug} />
          <textarea name="prompt" aria-label="Pertanyaan" defaultValue={q.prompt} rows={2} required className={field} />
          {q.type === "baca_kode" ? (
            <textarea name="code" aria-label="Kode" defaultValue={q.code ?? ""} rows={4} required className={`${field} font-mono`} />
          ) : (
            <input type="hidden" name="code" value="" />
          )}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm text-zinc-300">Opsi, tandai jawaban yang benar</legend>
            {q.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="answer" value={i} defaultChecked={q.answer === i} aria-label={`Opsi ${i + 1} benar`} className="size-5 shrink-0 accent-(--accent)" />
                <input name="options" defaultValue={opt} required aria-label={`Opsi ${i + 1}`} className={field} />
              </div>
            ))}
          </fieldset>
          <textarea name="explanation" aria-label="Pembahasan" defaultValue={q.explanation} rows={2} required className={field} />
          <div className="flex gap-2">
            <button className={smallButton}>Simpan</button>
            <button formAction={hapusBaris} formNoValidate className={dangerButton}><Trash2 aria-hidden className="size-4" />Hapus</button>
          </div>
        </form>
      </details>
    </li>
  );
}
