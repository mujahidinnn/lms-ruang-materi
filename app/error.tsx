"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { primaryButton } from "@/components/ui/styles";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Halaman ini gagal dimuat</h1>
      <p className="mt-2 max-w-sm text-zinc-400">
        Periksa koneksimu lalu muat ulang. Kalau masih gagal, kembali ke beranda dan coba lagi nanti.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-zinc-500">Kode: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <button onClick={() => retry()} className={primaryButton}><RotateCcw aria-hidden className="size-4" />Muat ulang</button>
        <Link href="/" className="text-zinc-400 hover:text-zinc-50">Ke beranda</Link>
      </div>
    </main>
  );
}
