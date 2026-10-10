import { Menu } from "lucide-react";
import Link from "next/link";
import AccountLink from "@/components/auth/AccountLink";
import Logo from "@/components/brand/Logo";

const LINKS = [
  { href: "/roadmap", label: "Roadmap" },
  { href: "/#materi", label: "Materi" },
  { href: "/template", label: "Template" },
];

export default function SiteHeader() {
  return (
    <header className="px-6 sm:px-10">
      <div className="mx-auto flex max-w-7xl items-center gap-3 py-5 sm:gap-6">
        <Link href="/" aria-label="Ruang Materi, beranda" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          <Logo />
        </Link>
        <nav aria-label="Utama" className="ml-auto flex items-center gap-1 text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hidden min-h-11 items-center rounded-lg px-3 text-zinc-400 hover:text-zinc-50 sm:flex">{l.label}</Link>
          ))}
          {/* Phones: the same links behind a native disclosure. */}
          <details className="relative sm:hidden">
            <summary aria-label="Menu" className="grid size-11 list-none place-items-center rounded-lg text-zinc-400 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
              <Menu aria-hidden className="size-5" />
            </summary>
            <div className="absolute right-0 z-50 mt-2 grid w-44 rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-lg">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="flex min-h-11 items-center rounded-lg px-3 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50">{l.label}</Link>
              ))}
            </div>
          </details>
          <AccountLink />
        </nav>
      </div>
    </header>
  );
}
