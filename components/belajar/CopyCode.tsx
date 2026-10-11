"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function CopyCode({ code }: { code: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      aria-label={done ? "Kode tersalin" : "Salin kode"}
      className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-zinc-900 text-zinc-400 shadow-soft hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent"
    >
      {done ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
    </button>
  );
}
