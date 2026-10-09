"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { mulaiImpor } from "@/app/admin/impor/actions";
import { smallButton } from "./editor";

// Decks migrated in phase 3 that have no AI draft yet. Their pptx sits in
// imports/migrasi/<slug>.pptx.
export default function MigrasiList({ slugs, models }: { slugs: string[]; models: string[] }) {
  const router = useRouter();
  const [model, setModel] = useState(models[0]);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  if (slugs.length === 0) return null;

  return (
    <section aria-labelledby="deck-lama" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="deck-lama" className="text-lg font-semibold">Deck lama tanpa draf</h2>
          <p className="text-sm text-zinc-400">Slide-nya sudah tayang. Buat ringkasan, tips, flashcard dan soal untuk satu deck sekali klik.</p>
        </div>
        <select
          aria-label="Model untuk deck lama"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="min-h-11 w-full rounded-md border border-zinc-800/80 bg-zinc-900 px-2 text-sm text-zinc-50 sm:w-72"
        >
          {models.map((m) => <option key={m} value={m}>{m.replace(":", " / ")}</option>)}
        </select>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-zinc-400">{message}</p>
      <ul className="flex flex-wrap gap-2">
        {slugs.map((slug) => (
          <li key={slug}>
            <button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await mulaiImpor({ filePath: `migrasi/${slug}.pptx`, originalName: `${slug}.pptx`, slug, model });
                  setMessage(res.error ?? `Draf ${slug} sedang dibuat.`);
                  router.refresh();
                })
              }
              className={`${smallButton} font-mono`}
            >
              {slug}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
