import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import Logo from "@/components/brand/Logo";
import ThemeButton from "@/components/ThemeButton";
import SideNav, { NavLinks, type NavSet } from "./SideNav";

// Signed-in screens: a white sidebar on the left from lg, a top bar with a
// scrolling link row on phones. `account` sits at the foot of the sidebar.
export default function AppShell({ set, account, children }: { set: NavSet; account: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="flex flex-wrap items-center gap-x-4 gap-y-3 bg-zinc-900 px-4 py-3 shadow-soft lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:flex-nowrap lg:items-stretch lg:gap-8 lg:px-4 lg:py-6">
        <Link href="/" aria-label="Ruang Materi, beranda" className="flex items-center gap-2 rounded-full px-2 focus-visible:outline-2 focus-visible:outline-accent">
          <Logo />
          {set === "admin" && <span className="rounded-full bg-tile-lavender px-2.5 py-0.5 text-xs font-medium">admin</span>}
        </Link>
        <div className="ml-auto flex items-center gap-2 lg:order-last lg:mt-auto lg:ml-0 lg:flex-col lg:items-stretch">
          <Suspense>{account}</Suspense>
          <div className="lg:px-2"><ThemeButton /></div>
        </div>
        {/* Second row on phones, under brand and Keluar. */}
        <div className="order-last w-full lg:order-none">
          <Suspense fallback={<NavLinks set={set} path="" />}>
            <SideNav set={set} />
          </Suspense>
        </div>
      </aside>
      <main className="w-full min-w-0 flex-1 px-4 py-8 sm:px-8 lg:py-10">{children}</main>
    </div>
  );
}
