"use client";

import { useState } from "react";
import { eksporData } from "@/app/profil/actions";

export default function ExportButton() {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    const data = await eksporData();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "ruang-materi-data-saya.json" });
    a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
  }

  return (
    <button onClick={download} disabled={busy} className="inline-flex min-h-11 items-center rounded-lg border border-zinc-800 px-4 text-sm hover:border-zinc-600 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50">
      {busy ? "Menyiapkan..." : "Unduh data saya (JSON)"}
    </button>
  );
}
