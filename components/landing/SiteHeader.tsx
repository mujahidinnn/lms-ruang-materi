import Link from "next/link";
import Logo from "@/components/brand/Logo";

export default function SiteHeader() {
  return (
    <header className="px-6 sm:px-10">
      <div className="mx-auto flex max-w-7xl items-center gap-6 py-5">
        <Link href="/" aria-label="Ruang Materi, beranda" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          <Logo />
        </Link>
        <nav aria-label="Utama" className="ml-auto flex items-center gap-1 text-sm">
          <a href="#materi" className="hidden min-h-11 items-center rounded-lg px-3 text-zinc-400 hover:text-zinc-50 sm:flex">Materi</a>
          <a href="#template" className="hidden min-h-11 items-center rounded-lg px-3 text-zinc-400 hover:text-zinc-50 sm:flex">Template</a>
          <Link
            href="/masuk"
            className="ml-2 flex min-h-11 items-center rounded-lg border border-zinc-800/80 px-4 text-zinc-50 hover:border-zinc-600 focus-visible:outline-2 focus-visible:outline-accent"
          >
            Masuk
          </Link>
        </nav>
      </div>
    </header>
  );
}
