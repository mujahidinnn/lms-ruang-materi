"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { mulaiImpor } from "@/app/admin/impor/actions";

// Decks migrated in phase 3 that have no AI draft yet. Their pptx sits in
// imports/migrasi/<slug>.pptx.
export default function MigrasiList({ slugs, model }: { slugs: string[]; model: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  if (slugs.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Deck lama tanpa draf</h2>
      <p aria-live="polite" className="min-h-5 text-sm text-zinc-400">{message}</p>
      <ul className="flex flex-wrap gap-2">
        {slugs.map((slug) => (
          <li key={slug}>
            <button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await mulaiImpor({ filePath: `migrasi/${slug}.pptx`, originalName: `${slug}.pptx`, slug, model });
                  setMessage(res.error ?? `Draf ${slug} dimulai.`);
                  router.refresh();
                })
              }
              className="min-h-11 rounded-md border border-zinc-800/80 px-3 text-sm hover:border-zinc-600 disabled:opacity-50"
            >
              {slug}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
