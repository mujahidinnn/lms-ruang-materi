"use client";

import { Bug, BookOpen, Lightbulb, MessageCircle, Palette, Send } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { field } from "@/components/admin/editor";
import { primaryButton } from "@/components/ui/styles";
import { MASUKAN, type MasukanId } from "@/lib/masukan";
import { rpc } from "@/lib/rpc";

type State = { error?: string; ok?: string };
const ICON = { saran: Lightbulb, bug: Bug, konten: BookOpen, tampilan: Palette, lainnya: MessageCircle } satisfies Record<MasukanId, unknown>;
const TONE = { saran: "bg-tile-mint", bug: "bg-tile-pink", konten: "bg-tile-butter", tampilan: "bg-tile-lavender", lainnya: "bg-tile-sky" } satisfies Record<MasukanId, string>;

// Global feedback: pick a kind, write, send. Signed-out visitors see a
// sign-in prompt instead (the server checks again). The page they came from
// travels along so a bug report says where it happened.
export default function MasukanForm({ signedIn }: { signedIn: boolean }) {
  const [kind, setKind] = useState<MasukanId>("saran");
  const [text, setText] = useState("");
  const [page, setPage] = useState("");
  const [state, run, pending] = useActionState(async (prev: State, form: FormData) => {
    const next = await (rpc("kirimMasukan") as unknown as (s: State, f: FormData) => Promise<State>)(prev, form);
    if (next.ok) setText("");
    return next;
  }, {} as State);

  useEffect(() => {
    try {
      const from = document.referrer && new URL(document.referrer);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only referrer, read once
      if (from && from.origin === location.origin && from.pathname !== "/masukan") setPage(from.pathname);
    } catch {}
  }, []);

  const current = MASUKAN.find((m) => m.id === kind)!;
  return (
    <form action={run} aria-busy={pending} className="grid gap-5">
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-semibold text-zinc-300">Jenis masukan</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {MASUKAN.map((m) => {
            const Icon = ICON[m.id];
            return (
              <label key={m.id} className="cursor-pointer">
                <input type="radio" name="category" value={m.id} checked={kind === m.id} onChange={() => setKind(m.id)} className="peer sr-only" />
                <span className="flex min-h-14 items-center gap-2.5 rounded-xl bg-zinc-900 px-3 text-sm font-semibold shadow-soft ring-2 ring-transparent hover:bg-zinc-800 peer-checked:ring-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                  <span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-lg text-zinc-50 ${TONE[m.id]}`}><Icon className="size-4" /></span>
                  {m.label}
                </span>
              </label>
            );
          })}
        </div>
        <p className="text-sm text-zinc-400">{current.hint}.</p>
      </fieldset>

      <label className="text-sm text-zinc-400">
        <span className="flex justify-between"><span className="font-semibold text-zinc-300">Ceritakan</span><span className="tabular-nums text-zinc-500">{text.length}/1000</span></span>
        <textarea
          name="message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          minLength={10}
          maxLength={1000}
          rows={6}
          disabled={!signedIn}
          placeholder={kind === "bug" ? "Apa yang kamu lakukan, apa yang terjadi, dan apa yang kamu harapkan?" : kind === "saran" ? "Fitur atau kelas apa yang kamu inginkan, dan untuk apa?" : "Tulis dengan bebas, makin jelas makin membantu."}
          className={`${field} mt-1 w-full py-3 leading-relaxed`}
        />
      </label>
      <input type="hidden" name="page" value={page} />
      {page && <p className="-mt-3 text-xs text-zinc-500">Dikirim bersama halaman asalmu: <span className="font-mono">{page}</span></p>}

      <div className="flex flex-wrap items-center gap-3">
        {signedIn ? (
          <button disabled={pending || text.trim().length < 10} className={primaryButton}><Send aria-hidden className="size-4" />{pending ? "Mengirim..." : "Kirim masukan"}</button>
        ) : (
          <a href="/masuk?next=/masukan" className={primaryButton}>Masuk untuk mengirim</a>
        )}
        <p aria-live="polite" className={`text-sm empty:hidden ${state.error ? "text-red-500" : "text-accent"}`}>{state.error ?? state.ok}</p>
      </div>
    </form>
  );
}
