"use client";

import { EyeOff, Globe, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { hapusTrack, tarikTrack, terbitkanTrack, type RoadmapState } from "@/app/admin/roadmap/actions";
import { dangerButton, primaryButton, smallButton } from "./editor";

export default function TrackActions({ slug, published, hasDraft }: { slug: string; published: boolean; hasDraft: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<RoadmapState>({});
  const [pending, start] = useTransition();
  const run = (fn: (s: string) => Promise<RoadmapState>) =>
    start(async () => {
      const res = await fn(slug);
      setState(res);
      if (res.ok) router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      <button onClick={() => run(terbitkanTrack)} disabled={pending || (published && !hasDraft)} className={primaryButton}>
        {!pending && <Globe aria-hidden className="size-4" />}
        {pending ? "Memproses..." : published && hasDraft ? "Terbitkan perubahan" : "Terbitkan"}
      </button>
      <div aria-live="polite">
        {(state.error || state.ok) && (
          <p className={`rounded-md border px-3 py-2 text-sm ${state.error ? "border-red-500/40 text-red-500" : "border-accent/40 text-accent"}`}>
            {state.error ?? state.ok}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {published && <button onClick={() => run(tarikTrack)} disabled={pending} className={smallButton}><EyeOff aria-hidden className="size-4" />Tarik dari publik</button>}
        <button
          onClick={() => confirm(`Hapus roadmap ${slug}? Topiknya tetap ada.`) && run(hapusTrack)}
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
