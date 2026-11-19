"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Select from "@/components/ui/Select";

const HASIL = [["", "Semua hasil"], ["lulus", "Lulus"], ["belum", "Belum lulus"]] as const;

// Filters apply as soon as they change: the page reloads with the new query.
export default function NilaiFilter({ exams, ujian, status, cari }: { exams: readonly (readonly [string, string])[]; ujian: string; status: string; cari: string }) {
  const [term, setTerm] = useState(cari);
  const first = useRef(true);

  const go = (next: Record<string, string>) => {
    const p = new URLSearchParams({ ujian, status, cari: term, ...next });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    location.search = p.toString();
  };

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => go({ cari: term }), 400);
    return () => clearTimeout(t);
    // biome-ignore lint/correctness/useExhaustiveDependencies: only the search text re-runs this
  }, [term]);

  return (
    <>
      <Select label="Ujian" value={ujian} options={[["", "Semua ujian"], ...exams]} onChange={(v) => go({ ujian: v })} className="w-full sm:w-64" />
      <Select label="Hasil" value={status} options={HASIL} onChange={(v) => go({ status: v })} className="w-full sm:w-44" />
      <label className="flex min-w-0 flex-1 basis-48 items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 focus-within:ring-2 focus-within:ring-accent">
        <Search aria-hidden className="size-4 shrink-0 text-zinc-500" />
        <span className="sr-only">Cari murid</span>
        <input type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Cari nama atau email" className="min-h-12 w-full bg-transparent text-sm outline-none placeholder:text-zinc-500" />
      </label>
    </>
  );
}
