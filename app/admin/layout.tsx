import Link from "next/link";
import { Suspense } from "react";
import AdminNav, { NavLinks } from "@/components/admin/AdminNav";
import SignOutButton from "@/components/auth/SignOutButton";
import Logo from "@/components/brand/Logo";
import { requireAdmin } from "@/lib/dal";

// Shell only. Every page and action still checks the admin role itself.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="relative flex flex-1 flex-col lg:flex-row">
      <aside className="m-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[28px] bg-zinc-900 px-3 py-3 shadow-soft lg:sticky lg:top-3 lg:h-[calc(100dvh-1.5rem)] lg:w-60 lg:flex-col lg:flex-nowrap lg:items-stretch lg:gap-8 lg:py-6">
        <Link href="/" aria-label="Ruang Materi, beranda" className="flex items-center gap-2 px-3">
          <Logo />
          <span className="rounded-full bg-tile-lavender px-2.5 py-0.5 text-xs font-medium">admin</span>
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
    <div className="ml-auto flex items-center gap-2 text-sm lg:order-last lg:mt-auto lg:ml-0 lg:flex-col lg:items-stretch">
      <span className="hidden truncate px-3 text-zinc-500 lg:block">{user.email}</span>
      <SignOutButton className="min-h-11 w-full rounded-xl px-3 text-left text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent" />
    </div>
  );
}
