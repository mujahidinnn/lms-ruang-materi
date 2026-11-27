import { Award, ShieldCheck, BookOpen, ClipboardCheck, BarChart3, History, Flag, GraduationCap, FileUp, LayoutDashboard, Megaphone, MessageSquareText, Rocket, Route, TriangleAlert, Users } from "lucide-react";

// Admin links in titled groups (learners use SiteHeader, GUIDELINE Navigation).
const SETS = {
  admin: [
    { title: "", links: [{ href: "/admin", label: "Ringkasan", Icon: LayoutDashboard }] },
    {
      title: "Konten",
      links: [
        { href: "/admin/topik", label: "Kelas", Icon: BookOpen },
        { href: "/admin/roadmap", label: "Roadmap", Icon: Route },
        { href: "/admin/studio", label: "Studio Proyek", Icon: Rocket },
        { href: "/admin/impor", label: "Impor", Icon: FileUp },
      ],
    },
    {
      title: "Penilaian",
      links: [
        { href: "/admin/ujian", label: "Ujian", Icon: ClipboardCheck },
        { href: "/admin/nilai", label: "Nilai", Icon: GraduationCap },
        { href: "/admin/karya", label: "Karya", Icon: Award },
      ],
    },
    {
      title: "Pengguna",
      links: [
        { href: "/admin/pengguna", label: "Pengguna", Icon: Users },
        { href: "/admin/persetujuan", label: "Persetujuan", Icon: ShieldCheck },
        { href: "/admin/pengumuman", label: "Pengumuman", Icon: Megaphone },
      ],
    },
    {
      title: "Pantauan",
      links: [
        { href: "/admin/analitik", label: "Analitik", Icon: BarChart3 },
        { href: "/admin/laporan", label: "Laporan", Icon: Flag },
        { href: "/admin/masukan", label: "Masukan", Icon: MessageSquareText },
        { href: "/admin/log", label: "Log aktivitas", Icon: History },
        { href: "/admin/error", label: "Error", Icon: TriangleAlert },
      ],
    },
  ],
};
export type NavSet = keyof typeof SETS;

// Server-rendered: the shell passes the path. Used twice, in the sidebar
// (lg) and in the phone drawer.
export default function SideNav({ set, path }: { set: NavSet; path: string }) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {SETS[set].map(({ title, links }) => (
        <div key={title} className="flex flex-col gap-0.5 [&+&]:mt-3">
          {title && <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{title}</p>}
          {links.map(({ href, label, Icon }) => {
            const current = href === "/admin" ? path === href : path.startsWith(href);
            return (
              <a
                key={href}
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-10 items-center gap-3 rounded-xl px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
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
