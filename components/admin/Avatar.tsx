"use client";

import { X } from "lucide-react";
import { useRef } from "react";

// Profile photo, or the first letter on a tile when there is none. Only
// https photos are used, and no referrer is sent to the photo host. A click
// on a photo opens it large in a native dialog (Esc, backdrop or X closes).
export default function Avatar({ name, src, admin = false, className = "size-11 text-base" }: { name: string; src?: string | null; admin?: boolean; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  if (!src?.startsWith("https://")) {
    return (
      <span aria-hidden className={`${className} grid shrink-0 place-items-center rounded-xl font-bold ${admin ? "bg-primary text-on-primary" : "bg-zinc-800 text-zinc-300"}`}>
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }
  // Google serves the photo at the size in the URL (=s96-c); ask for more.
  const large = src.replace(/=s\d+(-c)?$/, "=s640-c");
  return (
    <>
      <button type="button" aria-label={`Lihat foto ${name}`} onClick={() => dialog.current?.showModal()} className={`${className} shrink-0 cursor-zoom-in overflow-hidden rounded-xl bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}>
        <img src={src} alt="" referrerPolicy="no-referrer" loading="lazy" className="size-full object-cover" />
      </button>
      <dialog
        ref={dialog}
        aria-label={`Foto ${name}`}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border-2 border-noir bg-zinc-900 p-0 text-zinc-50 shadow-hard-lg backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="grid gap-4 p-4">
          <img src={large} alt={`Foto profil ${name}`} referrerPolicy="no-referrer" className="aspect-square w-full rounded-xl bg-zinc-800 object-cover" />
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="truncate font-semibold">{name}</p>
            <button type="button" aria-label="Tutup" onClick={() => dialog.current?.close()} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-zinc-800 hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-accent">
              <X aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
