"use client";

import Select from "@/components/ui/Select";
import { useState, useTransition } from "react";
import { smallButton } from "./editor";
import { rpc } from "@/lib/rpc";

const mulaiImpor = rpc("mulaiImpor");

// Decks migrated in phase 3 that have no AI draft yet. Their pptx sits in
// imports/migrasi/<slug>.pptx.
export default function MigrasiList({ slugs, models }: { slugs: string[]; models: string[] }) {
  const [model, setModel] = useState(models[0]);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  if (slugs.length === 0) return null;

  return (
    <section aria-labelledby="deck-lama" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="deck-lama" className="text-xl font-bold tracking-tight">Deck lama tanpa draf</h2>
          <p className="text-sm text-zinc-400">Slide-nya sudah tayang. Buat ringkasan, tips, flashcard dan soal untuk satu deck sekali klik.</p>
        </div>
        <Select label="Model untuk deck lama" value={model} options={models.map((m) => [m, m.replace(":", " / ")] as const)} onChange={setModel} className="w-full sm:w-72" />
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
                  location.reload();
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
