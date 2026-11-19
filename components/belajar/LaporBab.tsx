"use client";

import { ChevronDown, Flag } from "lucide-react";
import ActionForm from "@/components/admin/ActionForm";
import { field } from "@/components/admin/editor";
import Select from "@/components/ui/Select";
import { secondaryButton } from "@/components/ui/styles";

const JENIS = [["salah", "Ada yang salah"], ["tidak-jelas", "Kurang jelas"], ["lainnya", "Lainnya"]] as const;

// Folded under a chapter or an exam question: a typo, a wrong fact or a confusing part.
export default function LaporBab({ chapterId, questionId, className = "mt-8 border-2 border-dashed border-zinc-700 px-3 open:border-solid open:border-transparent open:bg-zinc-900 open:p-4 open:shadow-soft" }: { chapterId?: string; questionId?: string; className?: string }) {
  return (
    <details className={`group rounded-2xl ${className}`}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 text-sm font-semibold text-zinc-300 hover:text-zinc-50 group-open:min-h-11 group-open:text-zinc-50 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-800"><Flag className="size-4" /></span>
        <span className="min-w-0 flex-1">Ada yang salah atau kurang jelas di {questionId ? "soal" : "bab"} ini?</span>
        <ChevronDown aria-hidden className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <ActionForm action="laporkan" className="mt-3 flex flex-col gap-3">
        {chapterId && <input type="hidden" name="chapter_id" value={chapterId} />}
        {questionId && <input type="hidden" name="question_id" value={questionId} />}
        <Select name="kind" label="Jenis" prefix value="salah" options={JENIS} />
        <label className="text-sm">
          <span className="text-zinc-400">Ceritakan singkat, sebutkan bagian atau kalimatnya</span>
          <textarea name="note" required maxLength={500} rows={3} className={`${field} mt-1 w-full py-3`} />
        </label>
        <button className={`${secondaryButton} w-fit`}>Kirim laporan</button>
      </ActionForm>
    </details>
  );
}
