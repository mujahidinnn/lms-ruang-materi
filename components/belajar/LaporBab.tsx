"use client";

import { Flag } from "lucide-react";
import ActionForm from "@/components/admin/ActionForm";
import { field } from "@/components/admin/editor";
import Select from "@/components/ui/Select";
import { secondaryButton } from "@/components/ui/styles";

const JENIS = [["salah", "Ada yang salah"], ["tidak-jelas", "Kurang jelas"], ["lainnya", "Lainnya"]] as const;

// Folded under the chapter: a typo, a wrong fact or a confusing part.
export default function LaporBab({ chapterId }: { chapterId: string }) {
  return (
    <details className="mt-10 rounded-2xl bg-zinc-900 p-4 shadow-soft">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-zinc-300">
        <Flag aria-hidden className="size-4" />Ada yang salah atau kurang jelas di bab ini?
      </summary>
      <ActionForm action="laporkanBab" className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="chapter_id" value={chapterId} />
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
