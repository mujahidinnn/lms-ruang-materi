"use client";

import { ArrowDown, ArrowUp, Eye, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { geserBab, hapusBab, simpanBab } from "@/app/admin/topik/chapter-actions";
import MarkdownBase from "@/components/belajar/MarkdownBase";
import type { Slide } from "@/lib/slides";
import StatusBadge from "./StatusBadge";
import { dangerButton, field, smallButton } from "./editor";

export type ChapterRow = { id: string; status: string; position: number; slug: string; title: string; body: string; est_minutes: number; slide_from: number | null; slide_to: number | null };

export default function ChapterEditor({ topic, c, n, slides }: { topic: string; c: ChapterRow; n: number; slides: Slide[] }) {
  const [preview, setPreview] = useState(false);
  const [body, setBody] = useState(c.body);
  return (
    <li className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">Bab {n}</p>
        <div className="flex items-center gap-2">
          <StatusBadge status={c.status} />
          <form action={geserBab}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="topic" value={topic} /><input type="hidden" name="arah" value="naik" /><button aria-label="Naikkan" className={smallButton}><ArrowUp aria-hidden className="size-4" /></button></form>
          <form action={geserBab}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="topic" value={topic} /><input type="hidden" name="arah" value="turun" /><button aria-label="Turunkan" className={smallButton}><ArrowDown aria-hidden className="size-4" /></button></form>
        </div>
      </div>
      <form action={simpanBab} className="mt-3 grid gap-3">
        <input type="hidden" name="id" value={c.id} />
        <input type="hidden" name="topic" value={topic} />
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <label className="text-sm text-zinc-400">Judul<input name="title" defaultValue={c.title} required maxLength={120} className={`${field} mt-1`} /></label>
          <label className="text-sm text-zinc-400">Slug<input name="slug" defaultValue={c.slug} required pattern="[a-z0-9\-]+" className={`${field} mt-1 font-mono`} /></label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm text-zinc-400">Menit<input name="est_minutes" type="number" min={1} max={60} defaultValue={c.est_minutes} className={`${field} mt-1`} /></label>
          <label className="text-sm text-zinc-400">Slide dari<input name="slide_from" type="number" min={1} defaultValue={c.slide_from ?? ""} className={`${field} mt-1`} /></label>
          <label className="text-sm text-zinc-400">Slide sampai<input name="slide_to" type="number" min={1} defaultValue={c.slide_to ?? ""} className={`${field} mt-1`} /></label>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPreview(false)} aria-pressed={!preview} className={smallButton}><Pencil aria-hidden className="size-4" />Tulis</button>
          <button type="button" onClick={() => setPreview(true)} aria-pressed={preview} className={smallButton}><Eye aria-hidden className="size-4" />Pratinjau</button>
        </div>
        <textarea name="body" aria-label="Isi bab (markdown)" value={body} onChange={(e) => setBody(e.target.value)} rows={16} hidden={preview} className={`${field} font-mono leading-relaxed`} />
        {preview && <div className="rounded-2xl bg-zinc-950 p-5"><MarkdownBase body={body} slides={slides} /></div>}
        <p className="text-xs text-zinc-500">Sisipkan slide dengan <code className="font-mono">![keterangan](slide:12)</code>.</p>
        <div className="flex gap-2">
          <button className={smallButton}>Simpan bab</button>
        </div>
      </form>
      <form action={hapusBab} className="mt-2" onSubmit={(e) => { if (!confirm(`Hapus bab "${c.title}" beserta kuisnya?`)) e.preventDefault(); }}>
        <input type="hidden" name="id" value={c.id} />
        <input type="hidden" name="topic" value={topic} />
        <button className={dangerButton}><Trash2 aria-hidden className="size-4" />Hapus bab</button>
      </form>
    </li>
  );
}
