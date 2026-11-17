import { Pencil, Trash2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { dangerButton, field, smallButton } from "./editor";
import { rpc } from "@/lib/rpc";

const hapusBaris = rpc("hapusBaris");
const simpanBaris = rpc("simpanBaris");

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
    <li className="rounded-2xl bg-zinc-800/40 p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {fields.map((f, i) => (
            <p key={f.name} className={i === 0 ? "font-medium text-zinc-50" : "text-sm text-zinc-400"}>{row[f.name]}</p>
          ))}
        </div>
        <StatusBadge status={row.status} />
      </div>
      <details className="mt-3">
        <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-full bg-zinc-900 px-4 text-sm text-zinc-300 shadow-soft hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden"><Pencil aria-hidden className="size-3.5" />Edit</summary>
        <form action={simpanBaris} className="mt-4 flex flex-col gap-3 border-t border-zinc-800 pt-4">
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
            <button formAction={hapusBaris} formNoValidate className={dangerButton} data-confirm="Hapus baris ini?" data-confirm-action="Hapus" data-confirm-danger><Trash2 aria-hidden className="size-4" />Hapus</button>
          </div>
        </form>
      </details>
    </li>
  );
}
