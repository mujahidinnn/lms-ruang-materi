"use client";

import { useState, useTransition } from "react";
import { hapusTopik, tarik, terbitkan, type TopikState } from "@/app/admin/topik/actions";
import { smallButton } from "./editor";

export default function TopicActions({ slug, published }: { slug: string; published: boolean }) {
  const [state, setState] = useState<TopikState>({});
  const [pending, start] = useTransition();
  const run = (fn: (s: string) => Promise<TopikState>) => start(async () => setState(await fn(slug)));

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        {published && <button onClick={() => run(tarik)} disabled={pending} className={smallButton}>Tarik</button>}
        <button
          onClick={() => confirm(`Hapus topik ${slug} beserta semua isinya?`) && run(hapusTopik)}
          disabled={pending}
          className={`${smallButton} text-red-500`}
        >
          Hapus
        </button>
        <button
          onClick={() => run(terbitkan)}
          disabled={pending}
          className="min-h-11 rounded-md bg-accent px-4 font-medium text-zinc-950 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
        >
          Terbitkan
        </button>
      </div>
      <p aria-live="polite" className={`min-h-5 text-sm ${state.error ? "text-red-500" : "text-accent"}`}>
        {state.error ?? state.ok}
      </p>
    </div>
  );
}
