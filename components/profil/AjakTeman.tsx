import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { smallButton } from "@/components/admin/editor";

export default function AjakTeman({ code, joined, origin }: { code: string; joined: number; origin: string }) {
  const link = `${origin}/daftar?ref=${code}`;
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }
  return (
    <div className="mt-4 grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-xl bg-zinc-800 px-4 py-2 font-mono text-lg font-bold tracking-widest">{code}</span>
        <button type="button" onClick={copy} className={smallButton}>
          {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
          <span aria-live="polite">{copied ? "Tersalin" : "Salin link"}</span>
        </button>
      </div>
      <p className="break-all text-xs text-zinc-500">{link}</p>
      <p className="text-sm text-zinc-300">
        <span className="font-semibold tabular-nums">{joined}</span> teman bergabung lewat linkmu
      </p>
    </div>
  );
}
