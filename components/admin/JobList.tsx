"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { mulaiImpor } from "@/app/admin/impor/actions";
import { createClient } from "@/lib/supabase/client";

export type Job = {
  id: string;
  file_path: string;
  original_name: string;
  slug: string;
  provider: string;
  model: string;
  status: "queued" | "rendering" | "drafting" | "done" | "failed";
  error: string | null;
  created_at: string;
  updated_at: string;
};

const LABEL: Record<Job["status"], string> = {
  queued: "antre",
  rendering: "merender slide",
  drafting: "menyusun draf",
  done: "selesai",
  failed: "gagal",
};

const active = (j: Job) => j.status === "queued" || j.status === "rendering" || j.status === "drafting";

export default function JobList({ initial, models }: { initial: Job[]; models: string[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initial);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const running = jobs.some(active);

  // Polls only while a job runs. No websockets.
  useEffect(() => {
    if (!running) return;
    const supabase = createClient();
    const timer = setInterval(async () => {
      const { data } = await supabase.from("import_jobs").select("*").order("created_at", { ascending: false }).limit(20);
      if (data) setJobs(data as Job[]);
    }, 4000);
    return () => clearInterval(timer);
  }, [running]);

  function ulang(job: Job, model: string) {
    start(async () => {
      const res = await mulaiImpor({ filePath: job.file_path, originalName: job.original_name, slug: job.slug, model });
      setMessage(res.error ?? "Impor diulang.");
      router.refresh();
    });
  }

  if (jobs.length === 0) return <p className="text-sm text-zinc-500">Belum ada impor. Pilih file .pptx untuk mulai.</p>;

  return (
    <div className="flex flex-col gap-2">
      <p aria-live="polite" className="min-h-5 text-sm text-zinc-400">{message}</p>
      <ul className="divide-y divide-zinc-800/80 rounded-lg border border-zinc-800/80">
        {jobs.map((j) => (
          <li key={j.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm">
            <span className="min-w-40 flex-1 truncate text-zinc-50">{j.original_name || j.slug}</span>
            <span className={j.status === "failed" ? "text-red-500" : j.status === "done" ? "text-accent" : "text-zinc-300"}>
              {LABEL[j.status]}
              {active(j) && "..."}
            </span>
            <span className="text-zinc-500">{j.model}</span>
            {j.status === "done" && (
              <Link href={`/admin/topik/${j.slug}`} className="min-h-11 content-center text-accent underline-offset-4 hover:underline">
                Tinjau
              </Link>
            )}
            {j.status === "failed" && (
              <Ulang models={models} current={`${j.provider}:${j.model}`} disabled={pending || running} onRetry={(m) => ulang(j, m)} />
            )}
            {j.error && <span className="w-full text-xs text-zinc-500">{j.error}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ulang({ models, current, disabled, onRetry }: { models: string[]; current: string; disabled: boolean; onRetry: (m: string) => void }) {
  const [model, setModel] = useState(models.includes(current) ? current : models[0]);
  return (
    <span className="flex items-center gap-2">
      <select aria-label="Model untuk ulang" value={model} onChange={(e) => setModel(e.target.value)} className="min-h-11 rounded-md border border-zinc-800/80 bg-zinc-900 px-2 text-zinc-50">
        {models.map((m) => <option key={m} value={m}>{m.replace(":", " · ")}</option>)}
      </select>
      <button onClick={() => onRetry(model)} disabled={disabled} className="min-h-11 rounded-md border border-zinc-800/80 px-3 hover:border-zinc-600 disabled:opacity-50">
        Ulang
      </button>
    </span>
  );
}
