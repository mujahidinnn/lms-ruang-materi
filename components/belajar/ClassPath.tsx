"use client";

import { Award, Check, ClipboardCheck, Code2, ListChecks, Lock } from "lucide-react";
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
  const [nama, setNama] = useState("");

  useEffect(() => {
    if (!signedIn) return;
    const db = createClient();
    db.rpc("certificate_status", { p_topic: topic.id }).then(({ data }) => data && setStatus(data as Status));
    // The sample certificate carries the learner's own name.
    db.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id;
      if (uid) db.from("profiles").select("display_name").eq("user_id", uid).maybeSingle().then(({ data: p }) => setNama(p?.display_name?.trim() ?? ""));
    });
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

  // Steps to the certificate, the first already done: opening the class
  // counts (a head start lifts completion, see the research note in the
  // class path design). Guests see the same steps with only that one ticked.
  const chaptersDone = !!status && status.chapters_total > 0 && status.chapters_done >= status.chapters_total;
  const steps = [
    { label: "Buka kelas", done: true },
    { label: status ? `Bab ${status.chapters_done}/${status.chapters_total}` : `${topic.chapters.length} bab`, done: chaptersDone },
    ...(topic.hasExam ? [{ label: "Ujian akhir", done: !!status?.exam_passed }] : []),
    ...(topic.project ? [{ label: "Proyek akhir", done: !!status?.project_passed }] : []),
  ];
  const doneCount = steps.filter((x) => x.done).length;
  const contoh = `/sertifikat/contoh?kelas=${encodeURIComponent(topic.title)}&slug=${topic.slug}${nama ? `&nama=${encodeURIComponent(nama)}` : ""}`;

  return (
    <ol className="mt-4 grid gap-3">
      <li className="rounded-[28px] bg-zinc-900 p-5 shadow-soft">
        <p className="text-sm font-bold">Langkah menuju sertifikat</p>
        <p className="mt-0.5 text-sm text-zinc-400 tabular-nums">{status?.code ? "Semua langkah selesai." : `Kamu sudah ${doneCount} dari ${steps.length} langkah.`}{!signedIn && " Masuk supaya langkahmu tercatat."}</p>
        <div aria-hidden className="mt-3 h-2 rounded-full bg-zinc-800"><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${(doneCount / steps.length) * 100}%` }} /></div>
        <ul className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold tabular-nums">
          {steps.map((x) => (
            <li key={x.label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${x.done ? "bg-matcha-300 text-noir" : "bg-zinc-800 text-zinc-400"}`}>
              {x.done && <Check aria-hidden className="size-3.5" />}{x.label}
            </li>
          ))}
        </ul>
      </li>
      {(topic.practiceCount > 0 || topic.hasExam) && (
        <Step href={`/latihan/${topic.slug}`} icon={<ListChecks aria-hidden className="size-5" />} title="Latihan ujian" text="Soal latihan dan try out 20 soal, kunci langsung terlihat. Opsional." tone="bg-matcha-50" />
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
          <span className="block text-sm text-on-noir/80">Bukti kamu menguasai {topic.title}, dengan kode yang bisa dicek siapa saja.</span>
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
          {!status?.code && (
            <a href={contoh} className="group mt-3 block w-full max-w-64">
              <img src={`${contoh.replace("/sertifikat/contoh?", "/sertifikat/contoh.svg?")}`} alt="" width={1123} height={794} loading="lazy" className="aspect-[1123/794] w-full rounded-md ring-1 ring-on-noir/20 transition-transform group-hover:-translate-y-0.5" />
              <span className="mt-1.5 block text-sm font-semibold text-matcha-300 group-hover:underline">Lihat contoh sertifikat{nama ? " dengan namamu" : ""}</span>
            </a>
          )}
          {error && <span role="alert" className="mt-1 block text-sm text-tile-pink">{error}</span>}
        </span>
        {status?.code ? (
          <a href={`/sertifikat/${status.code}`} className="inline-flex min-h-11 items-center rounded-full border-2 border-on-noir bg-matcha-300 px-5 font-bold text-noir">Lihat sertifikat</a>
        ) : status?.eligible ? (
          <button type="button" onClick={terbitkan} disabled={busy} className="inline-flex min-h-11 items-center rounded-full border-2 border-on-noir bg-matcha-300 px-5 font-bold text-noir disabled:opacity-50">
            {busy ? "Mengklaim..." : "Klaim sertifikat"}
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
