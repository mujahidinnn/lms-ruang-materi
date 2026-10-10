"use client";

import { ClipboardCheck } from "lucide-react";
import { useActionState } from "react";
import { mulaiUjian } from "@/app/ujian/actions";
import { primaryButton } from "@/components/ui/styles";

export default function StartExam({ examId, slug, label }: { examId: string; slug: string; label: string }) {
  const [state, run, pending] = useActionState(mulaiUjian, {});
  return (
    <form action={run}>
      <input type="hidden" name="exam" value={examId} />
      <input type="hidden" name="slug" value={slug} />
      <button disabled={pending} className={primaryButton}>{!pending && <ClipboardCheck aria-hidden className="size-4" />}{pending ? "Menyiapkan soal..." : label}</button>
      <p aria-live="polite" className="mt-3 text-sm text-red-500 empty:hidden">{state.error}</p>
    </form>
  );
}
