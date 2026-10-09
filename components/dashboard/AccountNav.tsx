import Link from "next/link";
import { keluar } from "@/app/masuk/actions";

const LINKS = [
  ["/dasbor", "Dasbor"],
  ["/flashcard", "Flashcard"],
  ["/nilai", "Nilai"],
  ["/profil", "Profil"],
] as const;

export default function AccountNav({ current }: { current: string }) {
  return (
    <nav aria-label="Akun" className="flex flex-wrap items-center gap-1 text-sm">
      {LINKS.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={href === current ? "page" : undefined}
          className={`flex min-h-11 items-center rounded-lg px-3 ${href === current ? "text-zinc-50" : "text-zinc-400 hover:text-zinc-50"}`}
        >
          {label}
        </Link>
      ))}
      <form action={keluar}>
        <button className="min-h-11 rounded-lg px-3 text-zinc-400 hover:text-zinc-50">Keluar</button>
      </form>
    </nav>
  );
}
