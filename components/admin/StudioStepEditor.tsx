"use client";

import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import MarkdownBase from "@/components/belajar/MarkdownBase";
import { rpc } from "@/lib/rpc";
import type { Check, Material } from "@/lib/studio/schema";
import { STAGES } from "@/lib/studio/stages";
import { dangerButton, field, smallButton } from "./editor";

type State = { error?: string; ok?: string };
export type StepRow = { id: string; stage: string; slug: string; title: string; body: string; est_minutes: number | null; materials: Material[]; checks: Check[] };

const newId = (p: string) => `${p}-${crypto.randomUUID().slice(0, 8)}`;
const hapus = rpc("hapusLangkahStudio");

// One step of a Studio project: the instructions in markdown, the materials
// learners copy or download, and the self-check items they tick.
export default function StudioStepEditor({ step }: { step: StepRow }) {
  const [state, run, pending] = useActionState(rpc("simpanLangkahStudio") as unknown as (s: State, f: FormData) => Promise<State>, {} as State);
  const [preview, setPreview] = useState(false);
  const [body, setBody] = useState(step.body);
  // Controlled: React resets uncontrolled fields to their defaults after a form action finishes.
  const [stage, setStage] = useState(step.stage);
  const [title, setTitle] = useState(step.title);
  const [slug, setSlug] = useState(step.slug);
  const [minutes, setMinutes] = useState(step.est_minutes === null ? "" : String(step.est_minutes));
  const [materials, setMaterials] = useState<Material[]>(step.materials);
  const [checks, setChecks] = useState<Check[]>(step.checks);

  const setMaterial = (i: number, patch: Partial<Material>) => setMaterials((m) => m.map((x, n) => (n === i ? ({ ...x, ...patch } as Material) : x)));

  return (
    <form action={run} aria-busy={pending} className="mt-3 grid gap-4">
      <input type="hidden" name="id" value={step.id} />
      <input type="hidden" name="materials" value={JSON.stringify(materials)} />
      <input type="hidden" name="checks" value={JSON.stringify(checks)} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-zinc-400">Tahap
          <select name="stage" value={stage} onChange={(e) => setStage(e.target.value)} className={`${field} mt-1`}>{STAGES.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.title}</option>)}</select>
        </label>
        <label className="text-sm text-zinc-400">Perkiraan menit
          <input name="est_minutes" type="number" min={1} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} className={`${field} mt-1`} />
        </label>
        <label className="text-sm text-zinc-400 sm:col-span-2">Judul langkah
          <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={120} className={`${field} mt-1`} />
        </label>
        <label className="text-sm text-zinc-400 sm:col-span-2">Slug (bagian alamat halaman)
          <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9-]{3,60}" className={`${field} mt-1 font-mono`} />
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-300">Arahan (markdown)</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPreview(false)} aria-pressed={!preview} className={smallButton}><Pencil aria-hidden className="size-4" />Tulis</button>
            <button type="button" onClick={() => setPreview(true)} aria-pressed={preview} className={smallButton}><Eye aria-hidden className="size-4" />Pratinjau</button>
          </div>
        </div>
        <textarea name="body" aria-label="Arahan (markdown)" value={body} onChange={(e) => setBody(e.target.value)} rows={18} maxLength={20000} hidden={preview} className={`${field} mt-2 font-mono leading-relaxed`} />
        {preview && <div className="mt-2 rounded-2xl bg-zinc-950 p-5"><MarkdownBase body={body} slides={[]} /></div>}
        <p className="mt-1 text-xs text-zinc-500">Gunakan <code className="font-mono">##</code> untuk subjudul, daftar bernomor untuk langkah, dan pagar tiga petik berbahasa untuk contoh kode. Tulis arahan selengkap mungkin, dari a sampai z.</p>
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-semibold text-zinc-300">Bahan (kode untuk disalin dan diunduh, atau tautan)</legend>
        {materials.map((m, i) => (
          <div key={m.id} className="grid gap-2 rounded-xl border border-zinc-800 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold">{m.kind === "kode" ? "Kode" : "Tautan"}</span>
              <input aria-label="Nama" value={m.name} onChange={(e) => setMaterial(i, { name: e.target.value })} placeholder={m.kind === "kode" ? "index.html" : "Nama tautan"} maxLength={80} className={`${field} min-w-0 flex-1`} />
              {m.kind === "kode" && <input aria-label="Bahasa" value={m.lang} onChange={(e) => setMaterial(i, { lang: e.target.value } as Partial<Material>)} placeholder="html" maxLength={20} className={`${field} w-24 font-mono`} />}
              <button type="button" aria-label="Hapus bahan" onClick={() => setMaterials((x) => x.filter((_, n) => n !== i))} className={dangerButton}><Trash2 aria-hidden className="size-4" /></button>
            </div>
            {m.kind === "kode" ? (
              <textarea aria-label="Isi kode" value={m.content} onChange={(e) => setMaterial(i, { content: e.target.value } as Partial<Material>)} rows={8} maxLength={20000} className={`${field} font-mono text-xs leading-relaxed`} />
            ) : (
              <input aria-label="Alamat" value={m.url} onChange={(e) => setMaterial(i, { url: e.target.value } as Partial<Material>)} placeholder="https://... atau /belajar/git" maxLength={300} className={field} />
            )}
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setMaterials((x) => [...x, { id: newId("m"), kind: "kode", name: "", lang: "", content: "" }])} className={smallButton}><Plus aria-hidden className="size-4" />Tambah kode</button>
          <button type="button" onClick={() => setMaterials((x) => [...x, { id: newId("m"), kind: "tautan", name: "", url: "" }])} className={smallButton}><Plus aria-hidden className="size-4" />Tambah tautan</button>
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-semibold text-zinc-300">Periksa dirimu (butir yang dicentang murid)</legend>
        {checks.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2">
            <input aria-label={`Butir ${i + 1}`} value={c.text} onChange={(e) => setChecks((x) => x.map((y, n) => (n === i ? { ...y, text: e.target.value } : y)))} maxLength={200} placeholder="Aku sudah ..." className={`${field} min-w-0 flex-1`} />
            <button type="button" aria-label="Hapus butir" onClick={() => setChecks((x) => x.filter((_, n) => n !== i))} className={dangerButton}><Trash2 aria-hidden className="size-4" /></button>
          </div>
        ))}
        <div><button type="button" onClick={() => setChecks((x) => [...x, { id: newId("c"), text: "" }])} className={smallButton}><Plus aria-hidden className="size-4" />Tambah butir</button></div>
        <p className="text-xs text-zinc-500">Menghapus butir menghapus centang murid pada butir itu.</p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className={`${smallButton} bg-primary font-semibold text-on-primary hover:bg-primary-hover hover:text-on-primary`}>{pending ? "Menyimpan..." : "Simpan langkah"}</button>
        <p aria-live="polite" className={`text-sm empty:hidden ${state.error ? "text-red-500" : "text-accent"}`}>{state.error ?? state.ok}</p>
        <button type="button" formNoValidate onClick={(e) => { if (confirm(`Hapus langkah "${step.title}"?`)) { const f = new FormData(); f.set("id", step.id); void hapus(f); } else e.preventDefault(); }} className={`${dangerButton} ml-auto`}><Trash2 aria-hidden className="size-4" />Hapus langkah</button>
      </div>
    </form>
  );
}
