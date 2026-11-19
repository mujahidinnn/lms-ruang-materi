import { Check, Pencil, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { dangerButton, field, smallButton } from "./editor";
import { rpc } from "@/lib/rpc";

const hapusBaris = rpc("hapusBaris");
const simpanBaris = rpc("simpanBaris");

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
  table: "practice_questions" | "exam_questions" | "chapter_questions";
  slug: string;
  q: Question;
  n: number;
}) {
  return (
    <li className="rounded-xl bg-zinc-800/40 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-zinc-800 text-xs font-bold tabular-nums">{n}</span>
        <span className="text-xs text-zinc-500">{TYPE[q.type]}</span>
        <span className="ml-auto"><StatusBadge status={q.status} /></span>
      </div>
      <p className="mt-3 font-medium text-zinc-50">{q.prompt}</p>
      {q.code && (
        <pre className="mt-2 overflow-x-auto rounded-xl bg-zinc-800/60 p-4 text-sm"><code className="font-mono">{q.code}</code></pre>
      )}
      <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {q.options.map((opt, i) => (
          <li key={i} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${i === q.answer ? "bg-tile-mint font-medium text-zinc-50" : "bg-zinc-900 text-zinc-300"}`}>
            {i === q.answer ? <Check aria-label="Jawaban benar" className="mt-0.5 size-4 shrink-0" /> : <span aria-hidden className="w-4 shrink-0" />}
            {opt}
          </li>
        ))}
      </ol>
      <p className="mt-3 rounded-xl bg-zinc-900 px-3 py-2 text-sm text-zinc-400">{q.explanation}</p>

      <details className="mt-3">
        <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-full bg-zinc-900 px-4 text-sm text-zinc-300 shadow-soft hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden"><Pencil aria-hidden className="size-3.5" />Edit</summary>
        <form action={simpanBaris} className="mt-4 flex flex-col gap-3 border-t border-zinc-800 pt-4">
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
            <button formAction={hapusBaris} formNoValidate className={dangerButton} data-confirm="Hapus baris ini?" data-confirm-action="Hapus" data-confirm-danger><Trash2 aria-hidden className="size-4" />Hapus</button>
          </div>
        </form>
      </details>
    </li>
  );
}
