import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ImporForm from "@/components/admin/ImporForm";
import JobList, { type Job } from "@/components/admin/JobList";
import MigrasiList from "@/components/admin/MigrasiList";
import { requireAdmin } from "@/lib/dal";
import { enabledModels } from "@/lib/llm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Impor materi",
  description: "Unggah deck .pptx dan pantau proses impor.",
  robots: { index: false },
};

export default function ImporPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-12">
      <div>
        <Link href="/admin" className="text-sm text-zinc-400 hover:text-zinc-50">&larr; Admin</Link>
        <h1 className="mt-2 text-2xl font-semibold">Impor materi</h1>
      </div>
      <Suspense fallback={<p className="text-sm text-zinc-500">Memuat...</p>}>
        <Impor />
      </Suspense>
    </main>
  );
}

async function Impor() {
  await requireAdmin("/admin/impor");
  const supabase = await createClient();
  const [{ data: jobs }, { data: topics }] = await Promise.all([
    supabase.from("import_jobs").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("topics").select("slug"),
  ]);
  const { data: done } = await supabase.from("import_jobs").select("slug").eq("status", "done");
  const drafted = new Set((done ?? []).map((j) => j.slug));
  const models = enabledModels();

  if (models.length === 0) {
    return <p className="text-sm text-red-500">LLM_PROVIDERS belum diisi di env server.</p>;
  }

  return (
    <>
      <ImporForm models={models} />
      {/* Remount on a new job (router.refresh) so polling restarts. */}
      <JobList key={jobs?.[0]?.id ?? "kosong"} initial={(jobs ?? []) as Job[]} models={models} />
      <MigrasiList slugs={(topics ?? []).map((t) => t.slug).filter((s) => !drafted.has(s))} model={models[0]} />
    </>
  );
}
