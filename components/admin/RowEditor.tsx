import { hapusBaris, simpanBaris } from "@/app/admin/topik/actions";
import StatusBadge from "./StatusBadge";
import { field, smallButton } from "./editor";

// One editable row of tips or flashcards. Plain form posts, no client JS.
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
    <form action={simpanBaris} className="flex flex-col gap-2 rounded-lg border border-zinc-800/80 p-3">
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={row.id} />
      <input type="hidden" name="slug" value={slug} />
      <StatusBadge status={row.status} />
      {fields.map((f) => (
        <label key={f.name} className="flex flex-col gap-1 text-xs text-zinc-400">
          {f.label}
          <textarea name={f.name} defaultValue={row[f.name]} rows={2} required className={field} />
        </label>
      ))}
      <div className="flex gap-2">
        <button className={smallButton}>Simpan</button>
        <button formAction={hapusBaris} formNoValidate className={`${smallButton} text-red-500`}>Hapus</button>
      </div>
    </form>
  );
}
