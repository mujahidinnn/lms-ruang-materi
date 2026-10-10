"use client";

import { BookOpen, ClipboardCheck, FileUp, LayoutDashboard, Route } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Ringkasan", Icon: LayoutDashboard },
  { href: "/admin/impor", label: "Impor", Icon: FileUp },
  { href: "/admin/topik", label: "Topik", Icon: BookOpen },
  { href: "/admin/roadmap", label: "Roadmap", Icon: Route },
  { href: "/admin/ujian", label: "Ujian", Icon: ClipboardCheck },
];

export default function AdminNav() {
  return <NavLinks path={usePathname()} />;
}

// Also the Suspense fallback (no active item) while the path is unknown.
// A row on mobile, a column in the sidebar from lg.
export function NavLinks({ path }: { path: string }) {
  return (
    <nav aria-label="Admin" className="scrollbar-thin flex gap-1 overflow-x-auto lg:flex-col">
      {LINKS.map(({ href, label, Icon }) => {
        const current = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-3 rounded-full px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              current ? "bg-zinc-50 font-medium text-zinc-950" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
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
