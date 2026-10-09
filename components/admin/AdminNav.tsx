"use client";

import { BookOpen, FileUp, LayoutDashboard, Route } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Ringkasan", Icon: LayoutDashboard },
  { href: "/admin/impor", label: "Impor", Icon: FileUp },
  { href: "/admin/topik", label: "Topik", Icon: BookOpen },
  { href: "/admin/roadmap", label: "Roadmap", Icon: Route },
];

export default function AdminNav() {
  return <NavLinks path={usePathname()} />;
}

// Also the Suspense fallback (no active item) while the path is unknown.
// A row on mobile, a column in the sidebar from lg.
export function NavLinks({ path }: { path: string }) {
  return (
    <nav aria-label="Admin" className="flex gap-1 lg:flex-col">
      {LINKS.map(({ href, label, Icon }) => {
        const current = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              current ? "bg-accent/10 font-medium text-accent" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50"
            }`}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
