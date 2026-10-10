"use client";

import { CheckCircle2, Clock, LoaderCircle, RotateCcw, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { mulaiImpor } from "@/app/admin/impor/actions";
import { importErrorText } from "@/lib/import-errors";
import { createClient } from "@/lib/supabase/client";
import { smallButton } from "./editor";

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
};

const STATUS = {
  queued: { label: "Menunggu giliran", Icon: Clock, tone: "text-zinc-400" },
  rendering: { label: "Merender slide", Icon: LoaderCircle, tone: "text-zinc-300" },
  drafting: { label: "Menyusun draf", Icon: LoaderCircle, tone: "text-zinc-300" },
  done: { label: "Draf siap", Icon: CheckCircle2, tone: "text-accent" },
  failed: { label: "Gagal", Icon: XCircle, tone: "text-red-500" },
};

const active = (j: Job) => j.status === "queued" || j.status === "rendering" || j.status === "drafting";
const when = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

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

  return (
    <section aria-labelledby="riwayat" className="flex flex-col gap-3">
      <h2 id="riwayat" className="text-lg font-semibold">Riwayat impor</h2>
      <p aria-live="polite" className="sr-only">{message}</p>
      {message && <p className="text-sm text-zinc-400">{message}</p>}
      {jobs.length === 0 ? (
        <p className="text-sm text-zinc-400">Belum ada impor. Unggah deck pertama di atas.</p>
      ) : (
        <ul className="divide-y divide-zinc-800/80 border-y border-zinc-800/80">
          {jobs.map((j) => {
            const { label, Icon, tone } = STATUS[j.status];
            return (
              <li key={j.id} className="grid gap-x-4 gap-y-2 py-4 sm:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <p className="truncate font-medium">{j.original_name || j.slug}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-zinc-500">
                    <time dateTime={j.created_at}>{when.format(new Date(j.created_at))}</time>
                    <span className="font-mono">{j.model}</span>
                  </p>
                  <p className={`mt-2 flex items-center gap-1.5 text-sm ${tone}`}>
                    <Icon aria-hidden className={`size-4 ${active(j) && j.status !== "queued" ? "animate-spin motion-reduce:animate-none" : ""}`} />
                    {label}
                  </p>
                  {j.status === "failed" && (
                    <div className="mt-1 text-sm text-zinc-300">
                      {importErrorText(j.error)}
                      <details className="mt-1 text-xs text-zinc-500">
                        <summary className="cursor-pointer hover:text-zinc-300">Detail teknis</summary>
                        <p className="mt-1 break-all font-mono">{j.error}</p>
                      </details>
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  {j.status === "done" && <Link href={`/admin/topik/${j.slug}`} className={smallButton}>Tinjau draf</Link>}
                  {j.status === "failed" && (
                    <Ulang models={models} current={`${j.provider}:${j.model}`} disabled={pending || running} onRetry={(m) => ulang(j, m)} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Ulang({ models, current, disabled, onRetry }: { models: string[]; current: string; disabled: boolean; onRetry: (m: string) => void }) {
  const [model, setModel] = useState(models.includes(current) ? current : models[0]);
  return (
    <>
      <select
        aria-label="Model untuk ulang"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        className="min-h-11 max-w-56 rounded-md border border-zinc-800/80 bg-zinc-900 px-2 text-sm text-zinc-50"
      >
        {models.map((m) => <option key={m} value={m}>{m.replace(":", " / ")}</option>)}
      </select>
      <button onClick={() => onRetry(model)} disabled={disabled} className={smallButton}><RotateCcw aria-hidden className="size-4" />Ulang</button>
    </>
  );
}
