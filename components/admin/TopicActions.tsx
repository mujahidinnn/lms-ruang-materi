"use client";

import { EyeOff, Globe, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { hapusTopik, tarik, terbitkan, type TopikState } from "@/app/admin/topik/actions";
import { dangerButton, primaryButton, smallButton } from "./editor";

export default function TopicActions({ slug, published, hasDraft }: { slug: string; published: boolean; hasDraft: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<TopikState>({});
  const [pending, start] = useTransition();
  const run = (fn: (s: string) => Promise<TopikState>) =>
    start(async () => {
      const res = await fn(slug);
      setState(res);
      if (res.ok) router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      <button onClick={() => run(terbitkan)} disabled={pending || (published && !hasDraft)} className={primaryButton}>
        {!pending && <Globe aria-hidden className="size-4" />}
        {pending ? "Memproses..." : published && hasDraft ? "Terbitkan draf" : "Terbitkan"}
      </button>
      <div aria-live="polite">
        {(state.error || state.ok) && (
          <p className={`rounded-2xl px-4 py-3 text-sm ${state.error ? "bg-tile-pink" : "bg-tile-mint"}`}>
            {state.error ?? state.ok}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {published && <button onClick={() => run(tarik)} disabled={pending} className={smallButton}><EyeOff aria-hidden className="size-4" />Tarik dari publik</button>}
        <button
          onClick={() => confirm(`Hapus topik ${slug} beserta semua isinya? Ini tidak bisa dibatalkan.`) && run(hapusTopik)}
          disabled={pending}
          className={dangerButton}
        >
          <Trash2 aria-hidden className="size-4" />
          Hapus
        </button>
      </div>
    </div>
  );
}
