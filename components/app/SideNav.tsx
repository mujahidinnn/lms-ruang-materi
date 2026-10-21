import { BookOpen, ClipboardCheck, FileUp, LayoutDashboard, Route } from "lucide-react";

// Admin links (learners use SiteHeader, GUIDELINE Navigation).
const SETS = {
  admin: [
    { href: "/admin", label: "Ringkasan", Icon: LayoutDashboard },
    { href: "/admin/impor", label: "Impor", Icon: FileUp },
    { href: "/admin/topik", label: "Topik", Icon: BookOpen },
    { href: "/admin/roadmap", label: "Roadmap", Icon: Route },
    { href: "/admin/ujian", label: "Ujian", Icon: ClipboardCheck },
  ],
};
export type NavSet = keyof typeof SETS;

// Server-rendered: the shell passes the path. A row on mobile, a column in
// the sidebar from lg.
export default function SideNav({ set, path }: { set: NavSet; path: string }) {
  return (
    <nav aria-label="Admin" className="scrollbar-thin -mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col">
      {SETS[set].map(({ href, label, Icon }) => {
        const current = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <a
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-3 rounded-2xl px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              current ? "bg-primary font-semibold text-on-primary" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
            }`}
          >
            <Icon aria-hidden className="size-4.5" />
            {label}
          </a>
        );
      })}
    </nav>
  );
}
