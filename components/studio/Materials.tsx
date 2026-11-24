"use client";

import { Check, Copy, Download, ExternalLink, FileCode2 } from "lucide-react";
import { useState } from "react";
import type { Material } from "@/lib/studio/schema";

// A step's materials: code files to copy or download, and links.
export default function Materials({ items }: { items: Material[] }) {
  const [copied, setCopied] = useState("");

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? "" : c)), 1800);
    } catch {}
  }

  function download(name: string, text: string) {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name.replace(/[^\w.-]+/g, "_");
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ul className="grid gap-3">
      {items.map((m) =>
        m.kind === "kode" ? (
          <li key={m.id} className="overflow-hidden rounded-[18px] border-2 border-noir bg-zinc-900">
            <div className="flex flex-wrap items-center gap-2 border-b-2 border-noir bg-zinc-800 px-3 py-1.5">
              <FileCode2 aria-hidden className="size-4 text-zinc-400" />
              <span className="font-mono text-sm font-semibold">{m.name}</span>
              <span className="ml-auto flex gap-1">
                <button type="button" onClick={() => copy(m.id, m.content)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700">
                  {copied === m.id ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}{copied === m.id ? "Tersalin" : "Salin"}
                </button>
                <button type="button" onClick={() => download(m.name, m.content)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700">
                  <Download aria-hidden className="size-4" />Unduh
                </button>
              </span>
            </div>
            <pre className="scrollbar-thin max-h-80 overflow-auto bg-zinc-950 p-4 text-sm leading-relaxed"><code className="font-mono">{m.content}</code></pre>
          </li>
        ) : (
          <li key={m.id}>
            <a
              href={m.url}
              target={m.url.startsWith("http") ? "_blank" : undefined}
              rel={m.url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-zinc-900 px-4 text-sm font-semibold shadow-soft hover:bg-zinc-800"
            >
              {m.name}<ExternalLink aria-hidden className="size-4 shrink-0 text-zinc-400" />
            </a>
          </li>
        ),
      )}
    </ul>
  );
}
