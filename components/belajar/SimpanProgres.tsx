import { CloudUpload, LogIn } from "lucide-react";

// The guest's "this is not saved yet" box, shown right where the work was
// done (chapter quiz, code exercise, practice set). What they did is kept in
// this browser (lib/pending.ts) and sent once they sign in, so the text can
// promise they will not redo it.
export default function SimpanProgres({ text }: { text: string }) {
  const q = `?next=${encodeURIComponent(location.pathname)}`;
  return (
    <div role="status" className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-noir bg-tile-butter px-4 py-3 text-noir">
      <CloudUpload aria-hidden className="size-5 shrink-0" />
      <p className="min-w-48 flex-1 text-sm"><strong>Belum tersimpan.</strong> {text}</p>
      <div className="flex items-center gap-1">
        <a href={`/masuk${q}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-noir px-4 text-sm font-bold text-on-noir hover:opacity-90"><LogIn aria-hidden className="size-4" />Masuk</a>
        <a href={`/daftar${q}`} className="inline-flex min-h-11 items-center px-3 text-sm font-semibold underline">Daftar gratis</a>
      </div>
    </div>
  );
}
