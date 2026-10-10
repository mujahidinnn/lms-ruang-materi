import { Route } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Missing } from "@/components/illustrations";
import { primaryButton } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Halaman tidak ditemukan", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <Missing />
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-zinc-400">Mungkin materinya sudah dipindah atau alamatnya salah ketik.</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <Link href="/roadmap" className={primaryButton}><Route aria-hidden className="size-4" />Buka roadmap</Link>
        <Link href="/" className="text-zinc-400 hover:text-zinc-50">Ke beranda</Link>
      </div>
    </main>
  );
}
