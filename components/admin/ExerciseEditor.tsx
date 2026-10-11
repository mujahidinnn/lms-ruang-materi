"use client";

import { FlaskConical, Trash2 } from "lucide-react";
import { useState } from "react";
import { hapusLatihanKode, simpanLatihanKode } from "@/app/admin/topik/exercise-actions";
import { useSandbox, type RunResult } from "@/components/code/useSandbox";
import type { CodeExerciseData } from "@/lib/content";
import { dangerButton, field, smallButton } from "./editor";

export type ExerciseRow = Omit<CodeExerciseData, "kind"> & { kind: string; chapter_id: string };

const pretty = (v: unknown) => JSON.stringify(v, null, 2);
const label = "text-sm text-zinc-400";

// One exercise. "Uji solusi" runs the solution through the learner sandbox.
export default function ExerciseEditor({ topic, ex, n }: { topic: string; ex: ExerciseRow; n: number }) {
  const [kind, setKind] = useState(ex.kind);
  const [solution, setSolution] = useState(pretty(ex.solution));
  const [tests, setTests] = useState(pretty(ex.tests));
  const [setup, setSetup] = useState(ex.setup);
  const [out, setOut] = useState<RunResult | null>(null);
  const { run } = useSandbox();

  async function uji() {
    let input;
    try {
      input = { files: JSON.parse(solution), tests: JSON.parse(tests) };
    } catch {
      return setOut({ logs: [], results: [], error: "JSON tidak valid" });
    }
    if (kind !== "web" && kind !== "js" && kind !== "express") return setOut({ logs: [], results: [], error: `Jenis ${kind} belum bisa diuji` });
    setOut(await run({ kind, setup, ...input }));
  }

  return (
    <li className="py-5">
      <p className="text-sm font-semibold">Latihan kode {n}</p>
      <form action={simpanLatihanKode} className="mt-3 grid gap-3">
        <input type="hidden" name="id" value={ex.id} />
        <input type="hidden" name="topic" value={topic} />
        <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
          <label className={label}>Judul<input name="title" defaultValue={ex.title} required className={`${field} mt-1`} /></label>
          <label className={label}>
            Jenis
            <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} className={`${field} mt-1`}>
              <option value="web">Web</option>
              <option value="js">JavaScript</option>
              <option value="express">Express</option>
            </select>
          </label>
        </div>
        <label className={label}>Instruksi (markdown)<textarea name="prompt" defaultValue={ex.prompt} rows={4} className={`${field} mt-1`} /></label>
        <label className={label}>Kode awal (JSON: html, css, js atau code)<textarea name="starter" defaultValue={pretty(ex.starter)} rows={5} className={`${field} mt-1 font-mono`} /></label>
        <label className={label}>Solusi (JSON)<textarea name="solution" value={solution} onChange={(e) => setSolution(e.target.value)} rows={6} className={`${field} mt-1 font-mono`} /></label>
        <label className={label}>Setup, dijalankan sebelum kode<textarea name="setup" value={setup} onChange={(e) => setSetup(e.target.value)} rows={3} className={`${field} mt-1 font-mono`} /></label>
        <label className={label}>Pemeriksaan (JSON: daftar name dan check)<textarea name="tests" value={tests} onChange={(e) => setTests(e.target.value)} rows={6} className={`${field} mt-1 font-mono`} /></label>
        <div className="flex flex-wrap gap-2">
          <button className={smallButton}>Simpan latihan</button>
          <button type="button" onClick={uji} className={smallButton}><FlaskConical aria-hidden className="size-4" />Uji solusi</button>
        </div>
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
      <form
        action={hapusLatihanKode}
        className="mt-3"
        onSubmit={(e) => {
          if (!confirm(`Hapus latihan "${ex.title}"?`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={ex.id} />
        <input type="hidden" name="topic" value={topic} />
        <button className={dangerButton}><Trash2 aria-hidden className="size-4" />Hapus latihan</button>
      </form>
    </li>
  );
}
