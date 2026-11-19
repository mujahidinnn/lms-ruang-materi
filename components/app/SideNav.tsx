import { BookOpen, ClipboardCheck, BarChart3, GraduationCap, FileUp, LayoutDashboard, Megaphone, Route, Users } from "lucide-react";

// Admin links in two groups: the content, then the people (learners use
// SiteHeader, GUIDELINE Navigation).
const SETS = {
  admin: [
    [
      { href: "/admin", label: "Ringkasan", Icon: LayoutDashboard },
      { href: "/admin/impor", label: "Impor", Icon: FileUp },
      { href: "/admin/topik", label: "Topik", Icon: BookOpen },
      { href: "/admin/roadmap", label: "Roadmap", Icon: Route },
      { href: "/admin/ujian", label: "Ujian", Icon: ClipboardCheck },
      { href: "/admin/nilai", label: "Nilai", Icon: GraduationCap },
    ],
    [
      { href: "/admin/analitik", label: "Analitik", Icon: BarChart3 },
      { href: "/admin/pengguna", label: "Pengguna", Icon: Users },
      { href: "/admin/pengumuman", label: "Pengumuman", Icon: Megaphone },
    ],
  ],
};
export type NavSet = keyof typeof SETS;

// Server-rendered: the shell passes the path. Used twice, in the sidebar
// (lg) and in the phone drawer.
export default function SideNav({ set, path }: { set: NavSet; path: string }) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {SETS[set].map((group, i) => (
        <div key={i} className={`flex flex-col gap-1 ${i > 0 ? "mt-2 border-t border-zinc-800 pt-3" : ""}`}>
          {group.map(({ href, label, Icon }) => {
            const current = href === "/admin" ? path === href : path.startsWith(href);
            return (
              <a
                key={href}
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-2xl px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                  current ? "bg-primary font-semibold text-on-primary" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
                }`}
              >
                <Icon aria-hidden className="size-[18px] shrink-0" />
                {label}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
