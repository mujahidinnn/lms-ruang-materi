import { hapusBaris, simpanBaris } from "@/app/admin/topik/actions";
import StatusBadge from "./StatusBadge";
import { field, smallButton } from "./editor";

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

const TYPE = { pilihan_ganda: "Pilihan ganda", benar_salah: "Benar / salah", baca_kode: "Baca kode" };

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
    <form action={simpanBaris} className="flex flex-col gap-2 rounded-lg border border-zinc-800/80 p-3">
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={q.id} />
      <input type="hidden" name="slug" value={slug} />
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span>Soal {n}</span>
        <span>{TYPE[q.type]}</span>
        <StatusBadge status={q.status} />
      </div>
      <textarea name="prompt" aria-label="Pertanyaan" defaultValue={q.prompt} rows={2} required className={field} />
      {q.type === "baca_kode" ? (
        <textarea name="code" aria-label="Kode" defaultValue={q.code ?? ""} rows={4} required className={`${field} font-mono`} />
      ) : (
        <input type="hidden" name="code" value="" />
      )}
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-xs text-zinc-400">Opsi, pilih jawaban benar</legend>
        {q.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name="answer" value={i} defaultChecked={q.answer === i} aria-label={`Opsi ${i + 1} benar`} className="size-5 accent-(--accent)" />
            <input name="options" defaultValue={opt} required aria-label={`Opsi ${i + 1}`} className={field} />
          </div>
        ))}
      </fieldset>
      <textarea name="explanation" aria-label="Pembahasan" defaultValue={q.explanation} rows={2} required className={field} />
      <div className="flex gap-2">
        <button className={smallButton}>Simpan</button>
        <button formAction={hapusBaris} formNoValidate className={`${smallButton} text-red-500`}>Hapus</button>
      </div>
    </form>
  );
}
