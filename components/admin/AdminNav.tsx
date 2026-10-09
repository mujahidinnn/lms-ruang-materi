"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/impor", label: "Impor" },
  { href: "/admin/topik", label: "Topik" },
];

export default function AdminNav() {
  return <NavLinks path={usePathname()} />;
}

// Also the Suspense fallback (no active tab) while the path is unknown.
export function NavLinks({ path }: { path: string }) {
  return (
    <nav aria-label="Admin" className="flex gap-1">
      {LINKS.map(({ href, label }) => {
        const current = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`flex min-h-11 items-center rounded-md px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              current ? "bg-zinc-900 text-zinc-50" : "text-zinc-400 hover:text-zinc-50"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
