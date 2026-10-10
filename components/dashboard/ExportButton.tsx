"use client";

import { secondaryButton } from "@/components/ui/styles";

import { Download } from "lucide-react";
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
    <button onClick={download} disabled={busy} className={secondaryButton}>
      <Download aria-hidden className="size-4" />
      {busy ? "Menyiapkan..." : "Unduh data saya (JSON)"}
    </button>
  );
}
