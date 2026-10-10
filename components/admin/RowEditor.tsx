import { Trash2 } from "lucide-react";
import { hapusBaris, simpanBaris } from "@/app/admin/topik/actions";
import StatusBadge from "./StatusBadge";
import { dangerButton, field, smallButton } from "./editor";

// A tip or flashcard: readable first, the form opens on Edit.
export default function RowEditor({
  table,
  slug,
  row,
  fields,
}: {
  table: "tips" | "flashcards";
  slug: string;
  row: { id: string; status: string } & Record<string, string>;
  fields: { name: string; label: string }[];
}) {
  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          {fields.map((f, i) => (
            <p key={f.name} className={i === 0 ? "text-zinc-50" : "text-sm text-zinc-400"}>{row[f.name]}</p>
          ))}
        </div>
        <StatusBadge status={row.status} />
      </div>
      <details className="group mt-2">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm text-zinc-400 hover:text-zinc-50">Edit</summary>
        <form action={simpanBaris} className="mt-2 flex flex-col gap-3">
          <input type="hidden" name="table" value={table} />
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="slug" value={slug} />
          {fields.map((f) => (
            <label key={f.name} className="flex flex-col gap-1.5 text-sm text-zinc-300">
              {f.label}
              <textarea name={f.name} defaultValue={row[f.name]} rows={2} required className={field} />
            </label>
          ))}
          <div className="flex gap-2">
            <button className={smallButton}>Simpan</button>
            <button formAction={hapusBaris} formNoValidate className={dangerButton}><Trash2 aria-hidden className="size-4" />Hapus</button>
          </div>
        </form>
      </details>
    </li>
  );
}
