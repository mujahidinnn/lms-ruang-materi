import Link from "next/link";
import SignOutButton from "@/components/auth/SignOutButton";

const LINKS = [
  ["/dasbor", "Dasbor"],
  ["/flashcard", "Flashcard"],
  ["/nilai", "Nilai"],
  ["/profil", "Profil"],
] as const;

export default function AccountNav({ current }: { current: string }) {
  return (
    <nav aria-label="Akun" className="scrollbar-thin -mx-5 flex items-center gap-2 overflow-x-auto px-5 pb-1 text-sm sm:mx-0 sm:px-0">
      {LINKS.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={href === current ? "page" : undefined}
          className={`flex min-h-11 shrink-0 items-center rounded-full px-5 font-medium ${href === current ? "bg-zinc-50 text-zinc-950" : "bg-zinc-900 text-zinc-400 shadow-soft hover:text-zinc-50"}`}
        >
          {label}
        </Link>
      ))}
      <SignOutButton className="min-h-11 shrink-0 rounded-full px-4 text-zinc-400 hover:text-zinc-50" />
    </nav>
  );
}
