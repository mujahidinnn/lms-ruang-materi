import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { simpanUjian } from "@/app/admin/ujian/actions";
import ActionForm from "@/components/admin/ActionForm";
import StatusBadge from "@/components/admin/StatusBadge";
import { field, smallButton } from "@/components/admin/editor";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ujian",
  description: "Atur durasi, percobaan, nilai lulus dan jumlah soal tiap ujian.",
  robots: { index: false },
};

type Exam = {
  id: string;
  status: string;
  duration_minutes: number;
  max_attempts: number;
  pass_score: number;
  question_count: number;
  topics: { slug: string; title: string };
  exam_questions: { status: string }[];
};

const FIELDS = [
  ["duration_minutes", "Menit", 180],
  ["max_attempts", "Percobaan", 10],
  ["pass_score", "Lulus", 100],
  ["question_count", "Soal", 100],
] as const;

export default function UjianAdminPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight">Ujian</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Soal dan kuncinya diedit di halaman topik. Bank soal yang terbit harus minimal dua kali jumlah soal per percobaan.
      </p>
      <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Memuat...</p>}>
        <List />
      </Suspense>
    </div>
  );
}

async function List() {
  await requireAdmin("/admin/ujian");
  const { data } = await (await createClient())
    .from("exams")
    .select("id, status, duration_minutes, max_attempts, pass_score, question_count, topics(slug, title), exam_questions(status)")
    .order("created_at");
  const exams = (data ?? []) as unknown as Exam[];

  if (!exams.length) {
    return <p className="mt-6 text-zinc-400">Belum ada ujian. Ujian dibuat saat <Link href="/admin/impor" className="text-accent hover:underline">mengimpor deck</Link>.</p>;
  }

  return (
    <ul className="mt-6 divide-y divide-zinc-800/80 border-y border-zinc-800/80">
      {exams.map((e) => {
        const bank = e.exam_questions.filter((q) => q.status === "published").length;
        const drafts = e.exam_questions.length - bank;
        return (
          <li key={e.id} className="py-5">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <Link href={`/admin/topik/${e.topics.slug}#ujian`} className="font-medium hover:text-accent">{e.topics.title}</Link>
              <StatusBadge status={e.status} />
              <span className={`text-sm tabular-nums ${bank < 2 * e.question_count ? "text-accent-warm" : "text-zinc-500"}`}>
                bank {bank}{drafts > 0 && `, draf ${drafts}`}
              </span>
            </div>
            <ActionForm action={simpanUjian} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={e.id} />
              {FIELDS.map(([name, label, max]) => (
                <label key={name} className="text-xs text-zinc-500">
                  {label}
                  <input name={name} type="number" min={1} max={max} defaultValue={e[name]} required className={`${field} mt-1 max-w-24 tabular-nums`} />
                </label>
              ))}
              <button className={smallButton}>Simpan</button>
            </ActionForm>
          </li>
        );
      })}
    </ul>
  );
}
