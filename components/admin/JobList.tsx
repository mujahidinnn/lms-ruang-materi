"use client";

import Select from "@/components/ui/Select";
import { CheckCircle2, Clock, LoaderCircle, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { importErrorText } from "@/lib/import-errors";
import { createClient } from "@/lib/supabase/client";
import { chip } from "@/components/ui/styles";
import { smallButton } from "./editor";
import { rpc } from "@/lib/rpc";

const mulaiImpor = rpc("mulaiImpor");

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
  progress: number;
};

const STATUS = {
  queued: { label: "Menunggu giliran", Icon: Clock, tone: "text-zinc-400" },
  rendering: { label: "Merender slide", Icon: LoaderCircle, tone: "text-zinc-300" },
  drafting: { label: "Menyusun draf", Icon: LoaderCircle, tone: "text-zinc-300" },
  done: { label: "Draf siap", Icon: CheckCircle2, tone: "text-accent" },
  failed: { label: "Gagal", Icon: XCircle, tone: "text-red-500" },
  terbit: { label: "Sudah terbit", Icon: CheckCircle2, tone: "text-zinc-400" },
  diulang: { label: "Gagal, sudah diulang", Icon: RotateCcw, tone: "text-zinc-500" },
};
type View = keyof typeof STATUS;

const PROGRESS = { queued: [3, "Langkah 1 dari 3: menunggu giliran"], rendering: [6, "Langkah 2 dari 3: merender slide"], drafting: [10, "Langkah 3 dari 3: menyusun draf (paling lama)"] } as const;
const pct = (j: Job) => (j.status === "drafting" ? Math.max(j.progress, 10) : PROGRESS[j.status as keyof typeof PROGRESS][0]);
const RECENT = 6;
const active = (j: Job) => j.status === "queued" || j.status === "rendering" || j.status === "drafting";
const when = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// What a job means now: a done job whose class is published is history, and a
// failed job with a later success for the same slug needs no retry.
function viewOf(jobs: Job[], published: Set<string>) {
  return (j: Job): View => {
    if (j.status === "done" && published.has(j.slug)) return "terbit";
    if (j.status === "failed" && jobs.some((o) => o.slug === j.slug && o.status === "done" && o.created_at > j.created_at)) return "diulang";
    return j.status;
  };
}

const FILTERS = [
  ["semua", "Semua", () => true],
  ["jalan", "Berjalan", (v: View) => v === "queued" || v === "rendering" || v === "drafting"],
  ["siap", "Draf siap", (v: View) => v === "done"],
  ["terbit", "Sudah terbit", (v: View) => v === "terbit"],
  ["gagal", "Gagal", (v: View) => v === "failed"],
] as const;

const TILE: Record<View, string> = { queued: "bg-zinc-800", rendering: "bg-tile-butter", drafting: "bg-tile-butter", done: "bg-tile-mint", failed: "bg-tile-pink", terbit: "bg-zinc-800", diulang: "bg-zinc-800" };

export default function JobList({ initial, models, published }: { initial: Job[]; models: string[]; published: string[] }) {
  const [jobs, setJobs] = useState(initial);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("semua");
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
      location.reload();
    });
  }

  const view = viewOf(jobs, new Set(published));
  const test = FILTERS.find((f) => f[0] === filter)![2];
  const shown = jobs.filter((j) => test(view(j)));

  return (
    <section aria-labelledby="riwayat" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="riwayat" className="text-xl font-bold tracking-tight">Riwayat impor</h2>
        <div role="group" aria-label="Saring riwayat" className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {FILTERS.map(([key, label, t]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={`${chip} min-h-10 shrink-0 cursor-pointer ${filter === key ? "bg-primary font-semibold text-on-primary!" : "bg-zinc-800 hover:bg-zinc-700"}`}
            >
              {label}<span className="tabular-nums opacity-70">{jobs.filter((j) => t(view(j))).length}</span>
            </button>
          ))}
        </div>
      </div>
      <p aria-live="polite" className="sr-only">{message}</p>
      {message && <p className="text-sm text-zinc-400">{message}</p>}
      {shown.length === 0 ? (
        <p className="rounded-[18px] bg-zinc-900 p-8 text-center text-sm text-zinc-400 shadow-soft">
          {jobs.length === 0 ? "Belum ada impor. Unggah deck pertama di atas." : "Tidak ada impor dengan status ini."}
        </p>
      ) : (
        <>
          <ul className="grid gap-3">
            {shown.slice(0, RECENT).map((j) => <JobCard key={j.id} j={j} v={view(j)} models={models} disabled={pending || running} onRetry={(m) => ulang(j, m)} />)}
          </ul>
          {shown.length > RECENT && (
            <details className="rounded-[18px] bg-zinc-900 px-5 py-3 shadow-soft">
              <summary className="min-h-11 cursor-pointer list-none py-2.5 text-sm text-zinc-400 hover:text-zinc-50 [&::-webkit-details-marker]:hidden">
                Impor lama ({shown.length - RECENT})
              </summary>
              <ul className="divide-y divide-zinc-800">
                {shown.slice(RECENT).map((j) => (
                  <li key={j.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 text-sm">
                    <span className="min-w-0 truncate">{j.original_name || j.slug}</span>
                    <span className="flex items-center gap-3 text-xs text-zinc-500">
                      <time dateTime={j.created_at}>{when.format(new Date(j.created_at))}</time>
                      <span className={STATUS[view(j)].tone}>{STATUS[view(j)].label}</span>
                      {j.status === "done" && <a href={`/admin/topik/${j.slug}`} className="text-accent hover:underline">{view(j) === "terbit" ? "Lihat kelas" : "Tinjau"}</a>}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}

function JobCard({ j, v, models, disabled, onRetry }: { j: Job; v: View; models: string[]; disabled: boolean; onRetry: (m: string) => void }) {
  const { label, Icon, tone } = STATUS[v];
  return (
    <li className="flex flex-wrap items-start gap-x-4 gap-y-3 rounded-[18px] bg-zinc-900 p-4 shadow-soft sm:p-5">
      <span aria-hidden className={`grid size-11 shrink-0 place-items-center rounded-xl ${TILE[v]}`}>
        <Icon className={`size-5 ${tone} ${active(j) && j.status !== "queued" ? "animate-spin motion-reduce:animate-none" : ""}`} />
      </span>
      <div className={`min-w-0 flex-1 ${j.status === "done" ? "basis-32" : "basis-56"}`}>
        <p className="truncate font-medium">{j.original_name || j.slug}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
          <span className={`font-semibold ${tone}`}>{label}</span>
          <time dateTime={j.created_at}>{when.format(new Date(j.created_at))}</time>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 font-mono">{j.model}</span>
        </p>
        {active(j) && (
          <div className="mt-3">
            <div role="progressbar" aria-label="Progres impor" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct(j)} className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div className={`h-full rounded-full bg-brand transition-[width] duration-700 ${j.status === "queued" ? "" : "animate-pulse motion-reduce:animate-none"}`} style={{ width: `${pct(j)}%` }} />
            </div>
            <p className="mt-1 text-xs tabular-nums text-zinc-500">{PROGRESS[j.status as keyof typeof PROGRESS][1]}{j.status === "drafting" ? `, ${pct(j)}%` : ""}</p>
          </div>
        )}
        {v === "failed" && (
          <div className="mt-2 text-sm text-zinc-300">
            {importErrorText(j.error)}
            <details className="mt-1 text-xs text-zinc-500">
              <summary className="cursor-pointer hover:text-zinc-300">Detail teknis</summary>
              <p className="mt-1 break-all font-mono">{j.error}</p>
            </details>
          </div>
        )}
      </div>
      <div className={`flex flex-wrap items-center gap-2 sm:w-auto ${j.status === "done" ? "ml-auto" : "w-full"}`}>
        {j.status === "done" && <a href={`/admin/topik/${j.slug}`} className={smallButton}>{v === "terbit" ? "Lihat kelas" : "Tinjau draf"}</a>}
        {v === "failed" && <Ulang models={models} current={`${j.provider}:${j.model}`} disabled={disabled} onRetry={onRetry} />}
      </div>
    </li>
  );
}

function Ulang({ models, current, disabled, onRetry }: { models: string[]; current: string; disabled: boolean; onRetry: (m: string) => void }) {
  const [model, setModel] = useState(models.includes(current) ? current : models[0]);
  return (
    <>
      <Select label="Model untuk ulang" value={model} options={models.map((m) => [m, m.replace(":", " / ")] as const)} onChange={setModel} className="w-56" />
      <button onClick={() => onRetry(model)} disabled={disabled} className={smallButton}><RotateCcw aria-hidden className="size-4" />Ulang</button>
    </>
  );
}
