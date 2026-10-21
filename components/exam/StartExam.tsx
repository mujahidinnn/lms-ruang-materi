"use client";

import { ClipboardCheck } from "lucide-react";
import { useActionState } from "react";
import { primaryButton } from "@/components/ui/styles";
import { rpc } from "@/lib/rpc";

const mulaiUjian = rpc("mulaiUjian");

export default function StartExam({ examId, slug, label, minutes, left }: { examId: string; slug: string; label: string; minutes: number; left: number }) {
  const [state, run, pending] = useActionState(mulaiUjian, {});
  return (
    <form action={run} data-confirm="Mulai ujian sekarang?" data-confirm-text={`Waktu ${minutes} menit langsung berjalan dan tidak bisa dijeda. Ini memakai 1 dari ${left} sisa percobaanmu.`} data-confirm-action="Mulai ujian">
      <input type="hidden" name="exam" value={examId} />
      <input type="hidden" name="slug" value={slug} />
      <button disabled={pending} className={primaryButton}>{!pending && <ClipboardCheck aria-hidden className="size-4" />}{pending ? "Menyiapkan soal..." : label}</button>
      <p aria-live="polite" className="mt-3 text-sm text-red-500 empty:hidden">{state.error}</p>
    </form>
  );
}
