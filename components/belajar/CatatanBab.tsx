"use client";

import { Bookmark, NotebookPen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { field } from "@/components/admin/editor";
import { createClient } from "@/lib/supabase/client";

type Save = "idle" | "saving" | "saved" | "error";

// Personal note and bookmark for one chapter. The page is public and cached,
// so the row is read in the browser; RLS lets a learner touch only their own.
export default function CatatanBab({ chapterId }: { chapterId: string }) {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [note, setNote] = useState("");
  const [marked, setMarked] = useState(false);
  const [state, setState] = useState<Save>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const db = createClient();
    db.auth.getSession().then(async ({ data }) => {
      const id = data.session?.user.id ?? null;
      setUserId(id);
      if (!id) return;
      const { data: row } = await db.from("chapter_notes").select("note, bookmarked").eq("chapter_id", chapterId).maybeSingle();
      if (row) {
        setNote(row.note);
        setMarked(row.bookmarked);
      }
    });
    return () => clearTimeout(timer.current);
  }, [chapterId]);

  async function save(nextNote: string, nextMarked: boolean) {
    if (!userId) return;
    setState("saving");
    const db = createClient();
    // An empty note on an unmarked chapter is no row at all.
    const { error } =
      nextNote.trim() || nextMarked
        ? await db.from("chapter_notes").upsert({ user_id: userId, chapter_id: chapterId, note: nextNote, bookmarked: nextMarked, updated_at: new Date().toISOString() }, { onConflict: "user_id,chapter_id" })
        : await db.from("chapter_notes").delete().eq("chapter_id", chapterId);
    setState(error ? "error" : "saved");
  }

  function edit(value: string) {
    setNote(value);
    setState("idle");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save(value, marked), 800);
  }

  function toggle() {
    const next = !marked;
    setMarked(next);
    clearTimeout(timer.current);
    save(note, next);
  }

  return (
    <section aria-labelledby="catatan" className="mt-10 rounded-2xl bg-zinc-900 p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="catatan" className="flex items-center gap-2 text-lg font-extrabold">
          <NotebookPen aria-hidden className="size-5" />Catatanmu
        </h2>
        {userId && (
          <button
            type="button"
            onClick={toggle}
            aria-pressed={marked}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-zinc-800 px-4 text-sm font-semibold hover:bg-zinc-700 aria-pressed:bg-matcha-300 aria-pressed:text-noir"
          >
            <Bookmark aria-hidden className={`size-4 ${marked ? "fill-current" : ""}`} />
            {marked ? "Ditandai" : "Tandai bab ini"}
          </button>
        )}
      </div>
      {userId === null ? (
        <p className="mt-3 text-sm text-zinc-400">
          <a href={`/masuk?next=${encodeURIComponent(typeof location === "undefined" ? "/" : location.pathname)}`} className="font-semibold text-accent hover:underline">Masuk</a> untuk menulis catatan dan menandai bab. Hanya kamu yang bisa melihatnya.
        </p>
      ) : (
        <>
          <label className="mt-3 block text-sm text-zinc-400">
            <span className="sr-only">Catatan untuk bab ini</span>
            <textarea
              value={note}
              onChange={(e) => edit(e.target.value)}
              maxLength={4000}
              rows={4}
              disabled={userId === undefined}
              placeholder="Tulis hal yang ingin kamu ingat dari bab ini. Tersimpan otomatis."
              className={`${field} w-full py-3 leading-relaxed`}
            />
          </label>
          <p aria-live="polite" className="mt-1.5 flex justify-between text-xs tabular-nums text-zinc-500">
            <span className={state === "error" ? "text-red-500" : ""}>{state === "saving" ? "Menyimpan..." : state === "saved" ? "Tersimpan" : state === "error" ? "Gagal menyimpan, coba lagi." : ""}</span>
            <span>{note.length}/4000</span>
          </p>
        </>
      )}
    </section>
  );
}
