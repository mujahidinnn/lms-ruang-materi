import Link from "next/link";
import { Suspense } from "react";
import AccountLink from "@/components/auth/AccountLink";
import Logo from "@/components/brand/Logo";
import ThemeButton from "@/components/ThemeButton";
import MobileNav from "./MobileNav";

const LINKS = [
  { href: "/roadmap", label: "Roadmap" },
  { href: "/#materi", label: "Materi" },
  { href: "/template", label: "Template" },
];

export default function SiteHeader() {
  return (
    <header className="px-5 sm:px-10">
      <div className="mx-auto flex max-w-7xl items-center gap-3 py-5">
        <Link href="/" aria-label="Ruang Materi, beranda" className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          <Logo />
        </Link>
        <nav aria-label="Utama" className="ml-auto hidden items-center gap-1 rounded-full bg-zinc-900 p-1.5 text-sm shadow-soft sm:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="flex min-h-10 items-center rounded-full px-4 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <ThemeButton />
          <AccountLink />
        </div>
      </div>
      {/* usePathname() is request data; outside Suspense it breaks prerendering
          of dynamic routes under cacheComponents. */}
      <Suspense>
        <MobileNav />
      </Suspense>
    </header>
  );
}
