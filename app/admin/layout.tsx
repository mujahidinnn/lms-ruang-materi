import Link from "next/link";
import { Suspense } from "react";
import { keluar } from "@/app/masuk/actions";
import AdminNav, { NavLinks } from "@/components/admin/AdminNav";
import Logo from "@/components/brand/Logo";
import PageBackdrop from "@/components/PageBackdrop";
import { requireAdmin } from "@/lib/dal";

// Shell only. Every page and action still checks the admin role itself.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="relative flex flex-1 flex-col lg:flex-row">
      <PageBackdrop />
      <aside className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-zinc-800/80 px-4 py-3 lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:flex-col lg:flex-nowrap lg:items-stretch lg:gap-8 lg:border-r lg:border-b-0 lg:px-4 lg:py-6">
        <Link href="/" aria-label="Ruang Materi, beranda" className="flex items-center gap-2 px-3">
          <Logo />
          <span className="text-sm text-zinc-500">admin</span>
        </Link>
        <Suspense>
          <Akun />
        </Suspense>
        {/* Second row on mobile, under brand and Keluar. */}
        <div className="order-last w-full lg:order-none">
          <Suspense fallback={<NavLinks path="" />}>
            <AdminNav />
          </Suspense>
        </div>
      </aside>
      <main className="w-full min-w-0 flex-1 px-4 py-10 sm:px-8">{children}</main>
    </div>
  );
}

async function Akun() {
  const user = await requireAdmin();
  return (
    <form action={keluar} className="ml-auto flex items-center gap-2 text-sm lg:order-last lg:mt-auto lg:ml-0 lg:flex-col lg:items-stretch">
      <span className="hidden truncate px-3 text-zinc-500 lg:block">{user.email}</span>
      <button className="min-h-11 rounded-xl px-3 text-left text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent">
        Keluar
      </button>
    </form>
  );
}
