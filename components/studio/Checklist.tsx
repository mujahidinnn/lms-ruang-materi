"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import type { Check as Item } from "@/lib/studio/schema";
import { createClient } from "@/lib/supabase/client";

// One step's checklist. Ticks are saved per learner (RLS allows only their own
// rows); the page tells the progress bar through an event.
export default function Checklist({ project, items, done }: { project: string; items: Item[]; done: string[] }) {
  const [ticked, setTicked] = useState(() => new Set(done));
  const [error, setError] = useState("");

  async function toggle(id: string) {
    const on = !ticked.has(id);
    const next = new Set(ticked);
    if (on) next.add(id);
    else next.delete(id);
    setTicked(next);
    setError("");
    const db = createClient();
    const { data } = await db.auth.getSession();
    const uid = data.session?.user.id;
    const { error: e } = !uid
      ? { error: new Error("no session") }
      : on
        ? await db.from("studio_checks").insert({ user_id: uid, project, item: id })
        : await db.from("studio_checks").delete().eq("project", project).eq("item", id);
    // A tick already saved (23505) is fine; anything else rolls the box back.
    if (e && (e as { code?: string }).code !== "23505") {
      setTicked(new Set(ticked));
      setError("Gagal menyimpan centangmu. Coba lagi.");
      return;
    }
    window.dispatchEvent(new CustomEvent("studio-centang", { detail: { id, on } }));
  }

  return (
    <div>
      <ul className="grid gap-1">
        {items.map((it) => (
          <li key={it.id}>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-zinc-800/60">
              <input type="checkbox" checked={ticked.has(it.id)} onChange={() => toggle(it.id)} className="peer sr-only" />
              <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 border-noir bg-zinc-900 text-noir peer-checked:bg-matcha-300 peer-focus-visible:outline-2 peer-focus-visible:outline-accent [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
                <Check className="size-4" strokeWidth={3} />
              </span>
              <span className={`text-sm leading-relaxed ${ticked.has(it.id) ? "text-zinc-500 line-through" : "text-zinc-50"}`}>{it.text}</span>
            </label>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="mt-2 text-sm text-red-500 empty:hidden">{error}</p>
    </div>
  );
}
