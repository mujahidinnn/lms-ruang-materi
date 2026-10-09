import Link from "next/link";
import { Suspense } from "react";
import { keluar } from "@/app/masuk/actions";
import AdminNav, { NavLinks } from "@/components/admin/AdminNav";
import PageBackdrop from "@/components/PageBackdrop";
import { requireAdmin } from "@/lib/dal";

// Shell only. Every page and action still checks the admin role itself.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="relative flex flex-1 flex-col">
      <PageBackdrop />
      <header className="border-b border-zinc-800/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/" className="font-semibold tracking-tight">
            Ruang Materi <span className="font-normal text-zinc-500">admin</span>
          </Link>
          <Suspense fallback={<NavLinks path="" />}>
            <AdminNav />
          </Suspense>
          <Suspense>
            <Akun />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}

async function Akun() {
  const user = await requireAdmin();
  return (
    <form action={keluar} className="ml-auto flex items-center gap-3 text-sm">
      <span className="hidden text-zinc-500 sm:inline">{user.email}</span>
      <button className="min-h-11 rounded-md px-3 text-zinc-400 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent">
        Keluar
      </button>
    </form>
  );
}
