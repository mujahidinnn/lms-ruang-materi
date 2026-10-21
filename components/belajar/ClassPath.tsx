"use client";

import { Award, Check, ClipboardCheck, Code2, ListChecks, Lock, Target } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Topic } from "@/lib/content";

type Status = {
  chapters_done: number;
  chapters_total: number;
  exam_passed: boolean;
  project_required: boolean;
  project_passed: boolean;
  eligible: boolean;
  code: string | null;
};

// The closing steps after the chapters, in order, with the signed-in
// learner's state from certificate_status(). Guests see the steps only.
export default function ClassPath({ topic, signedIn }: { topic: Topic; signedIn: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!signedIn) return;
    createClient()
      .rpc("certificate_status", { p_topic: topic.id })
      .then(({ data }) => data && setStatus(data as Status));
  }, [signedIn, topic.id]);

  async function terbitkan() {
    setBusy(true);
    setError("");
    const { data, error } = await createClient().rpc("issue_certificate", { p_topic: topic.id });
    setBusy(false);
    if (error?.message.includes("nama tampilan")) return location.assign("/profil#data");
    if (error) return setError(error.message);
    setStatus((s) => (s ? { ...s, code: data as string } : s));
  }

  const left = status ? status.chapters_total - status.chapters_done : null;
  const needs = [
    left ? `${left} bab lagi` : "",
    status && topic.hasExam && !status.exam_passed ? "lulus ujian" : "",
    status?.project_required && !status.project_passed ? "proyek akhir" : "",
  ].filter(Boolean);

  return (
    <ol className="mt-4 grid gap-3">
      {topic.practiceCount > 0 && (
        <Step href={`/latihan/${topic.slug}`} icon={<ListChecks aria-hidden className="size-5" />} title="Latihan soal" text={`${topic.practiceCount} soal dengan pembahasan`} tone="bg-matcha-50" />
      )}
      {topic.hasExam && (
        <Step href={`/latihan/${topic.slug}/persiapan`} icon={<Target aria-hidden className="size-5" />} title="Simulasi ujian" text="20 soal acak, kunci langsung terlihat" tone="bg-matcha-100" />
      )}
      {topic.hasExam && (
        <Step href={`/ujian/${topic.slug}`} icon={<ClipboardCheck aria-hidden className="size-5" />} title="Ujian akhir" text="Lulus untuk naik level" tone="bg-matcha-200" done={status?.exam_passed} />
      )}
      {topic.project && (
        <Step href={`/belajar/${topic.slug}/proyek`} icon={<Code2 aria-hidden className="size-5" />} title={`Proyek akhir: ${topic.project.title}`} text="Bangun sendiri, diperiksa otomatis" tone="bg-matcha-300" done={status?.project_passed} />
      )}
      <li className="flex flex-wrap items-center gap-4 rounded-[28px] border-2 border-noir bg-noir p-5 text-on-noir">
        <span className="grid size-11 shrink-0 -rotate-6 place-items-center rounded-2xl bg-matcha-300 text-noir"><Award aria-hidden className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Sertifikat</span>
          <span className="text-sm text-on-noir/70">
            {!signedIn
              ? "Masuk untuk menyimpan progres dan mendapat sertifikat."
              : status?.code
                ? `Kode ${status.code}`
                : status?.eligible
                  ? "Semua syarat terpenuhi. Sertifikat menampilkan nama tampilanmu."
                  : needs.length
                    ? `Selesaikan ${needs.join(", ")}.`
                    : "Memeriksa syarat..."}
          </span>
          {error && <span role="alert" className="mt-1 block text-sm text-tile-pink">{error}</span>}
        </span>
        {status?.code ? (
          <a href={`/sertifikat/${status.code}`} className="inline-flex min-h-11 items-center rounded-full border-2 border-on-noir bg-matcha-300 px-5 font-bold text-noir">Lihat sertifikat</a>
        ) : status?.eligible ? (
          <button type="button" onClick={terbitkan} disabled={busy} className="inline-flex min-h-11 items-center rounded-full border-2 border-on-noir bg-matcha-300 px-5 font-bold text-noir disabled:opacity-50">
            {busy ? "Menerbitkan..." : "Terbitkan sertifikat"}
          </button>
        ) : (
          <Lock aria-hidden className="size-5 text-on-noir/50" />
        )}
      </li>
    </ol>
  );
}

function Step({ href, icon, title, text, tone, done }: { href: string; icon: ReactNode; title: string; text: string; tone: string; done?: boolean }) {
  return (
    <li>
      <a href={href} className={`group flex items-center gap-4 rounded-[28px] border-2 border-noir p-5 text-noir transition-transform hover:-translate-y-0.5 motion-reduce:transition-none ${tone}`}>
        <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-noir bg-matcha-50">{done ? <Check aria-label="selesai" className="size-5" /> : icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{title}</span>
          <span className="text-sm text-matcha-800">{done ? "Selesai" : text}</span>
        </span>
      </a>
    </li>
  );
}
