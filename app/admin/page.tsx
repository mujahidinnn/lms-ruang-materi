import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { keluar } from "@/app/masuk/actions";
import { requireAdmin } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Admin",
  description: "Kelola materi Ruang Materi.",
  robots: { index: false },
};

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <nav className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/impor" className="min-h-11 content-center rounded-md border border-zinc-800/80 px-4 hover:border-zinc-600">Impor materi</Link>
        <Link href="/admin/topik" className="min-h-11 content-center rounded-md border border-zinc-800/80 px-4 hover:border-zinc-600">Topik</Link>
      </nav>
      <Suspense fallback={<p className="mt-4 text-sm text-zinc-500">Memuat...</p>}>
        <AdminHome />
      </Suspense>
    </main>
  );
}

async function AdminHome() {
  const user = await requireAdmin();
  return (
    <div className="mt-4 flex items-center justify-between gap-4 text-sm text-zinc-300">
      <span>Masuk sebagai {user.email}</span>
      <form action={keluar}>
        <button className="min-h-11 rounded-md border border-zinc-800/80 px-4 hover:border-zinc-600 focus-visible:outline-2 focus-visible:outline-accent">
          Keluar
        </button>
      </form>
    </div>
  );
}
