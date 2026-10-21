"use client";

import { BadgeCheck, FlaskConical, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSandbox, type RunResult } from "@/components/code/useSandbox";
import { rpc } from "@/lib/rpc";
import { dangerButton, field, smallButton } from "./editor";

const simpanProyek = rpc("simpanProyek");
const hapusProyek = rpc("hapusProyek");
const verifikasiProyek = rpc("verifikasiProyek");

export type ProjectRow = {
  id: string;
  kind: string;
  title: string;
  brief: string;
  prompt: string;
  starter: Record<string, string>;
  solution: Record<string, string>;
  setup: string;
  tests: { name: string; check: string }[];
  verified_at: string | null;
};

const pretty = (v: unknown) => JSON.stringify(v, null, 2);
const label = "text-sm text-zinc-400";

// The final project. Learners see it only once "Uji solusi" passes on the
// saved version; saving clears that mark.
export default function ProjectEditor({ p }: { p: ProjectRow }) {
  const [kind, setKind] = useState(p.kind);
  const [solution, setSolution] = useState(pretty(p.solution));
  const [tests, setTests] = useState(pretty(p.tests));
  const [setup, setSetup] = useState(p.setup);
  const [dirty, setDirty] = useState(false);
  const [out, setOut] = useState<RunResult | null>(null);
  const { run } = useSandbox();

  async function uji() {
    let input;
    try {
      input = { files: JSON.parse(solution), tests: JSON.parse(tests) };
    } catch {
      return setOut({ logs: [], results: [], error: "JSON tidak valid" });
    }
    if (kind !== "web" && kind !== "js" && kind !== "express" && kind !== "python") return setOut({ logs: [], results: [], error: `Jenis ${kind} belum bisa diuji` });
    const r = await run({ kind, setup, ...input });
    setOut(r);
    // Only the saved version can be marked; unsaved edits would not match.
    if (!dirty && !r.error && r.results.length && r.results.every((x) => x.pass)) await verifikasiProyek(p.id);
  }

  return (
    <div className="py-5">
      <p className={`inline-flex items-center gap-1.5 rounded-full border-2 border-noir px-3 py-1 text-xs font-bold ${p.verified_at ? "bg-matcha-300" : "bg-tile-butter"}`}>
        <BadgeCheck aria-hidden className="size-4" />
        {p.verified_at ? "Terverifikasi, tampil untuk murid" : "Belum diuji, belum tampil untuk murid"}
      </p>
      <form action={simpanProyek} onChange={() => setDirty(true)} className="mt-4 grid gap-3">
        <input type="hidden" name="id" value={p.id} />
        <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
          <label className={label}>Judul<input name="title" defaultValue={p.title} required className={`${field} mt-1`} /></label>
          <label className={label}>
            Jenis
            <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} className={`${field} mt-1`}>
              <option value="web">Web</option>
              <option value="js">JavaScript</option>
              <option value="express">Express</option>
              <option value="python">Python</option>
            </select>
          </label>
        </div>
        <label className={label}>Brief (markdown: apa yang dibangun, fitur wajib)<textarea name="brief" defaultValue={p.brief} rows={6} className={`${field} mt-1`} /></label>
        <label className={label}>Instruksi singkat di editor (markdown)<textarea name="prompt" defaultValue={p.prompt} rows={3} className={`${field} mt-1`} /></label>
        <label className={label}>Kode awal (JSON)<textarea name="starter" defaultValue={pretty(p.starter)} rows={5} className={`${field} mt-1 font-mono`} /></label>
        <label className={label}>Solusi (JSON, hanya admin yang bisa melihat)<textarea name="solution" value={solution} onChange={(e) => setSolution(e.target.value)} rows={8} className={`${field} mt-1 font-mono`} /></label>
        <label className={label}>Setup<textarea name="setup" value={setup} onChange={(e) => setSetup(e.target.value)} rows={3} className={`${field} mt-1 font-mono`} /></label>
        <label className={label}>Pemeriksaan (JSON, 5 sampai 12)<textarea name="tests" value={tests} onChange={(e) => setTests(e.target.value)} rows={8} className={`${field} mt-1 font-mono`} /></label>
        <div className="flex flex-wrap gap-2">
          <button className={smallButton}>Simpan proyek</button>
          <button type="button" onClick={uji} className={smallButton}><FlaskConical aria-hidden className="size-4" />Uji solusi</button>
        </div>
        {dirty && <p className="text-xs text-zinc-500">Simpan dulu, lalu uji solusi untuk menandai proyek terverifikasi.</p>}
      </form>
      {out && (
        <ul aria-live="polite" className="mt-3 space-y-2 text-sm">
          {out.error && <li className="rounded-2xl bg-tile-pink px-4 py-2">{out.error}</li>}
          {out.results.map((r, ri) => (
            <li key={ri} className={`rounded-2xl px-4 py-2 ${r.pass ? "bg-tile-mint" : "bg-tile-pink"}`}>
              {r.pass ? "Lolos" : "Gagal"}: {r.name}{r.error ? ` (${r.error})` : ""}
            </li>
          ))}
        </ul>
      )}
      <form action={hapusProyek} className="mt-3" onSubmit={(e) => { if (!confirm(`Hapus proyek "${p.title}"?`)) e.preventDefault(); }}>
        <input type="hidden" name="id" value={p.id} />
        <button className={dangerButton}><Trash2 aria-hidden className="size-4" />Hapus proyek</button>
      </form>
    </div>
  );
}
