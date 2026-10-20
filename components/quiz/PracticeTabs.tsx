
// Latihan and Simulasi ujian are two views of the same topic; pill tabs,
// the current one ink.
export default function PracticeTabs({ slug, current }: { slug: string; current: "latihan" | "persiapan" }) {
  const tabs = [
    { key: "latihan", href: `/latihan/${slug}`, label: "Latihan" },
    { key: "persiapan", href: `/latihan/${slug}/persiapan`, label: "Simulasi ujian" },
  ] as const;
  return (
    <nav aria-label="Jenis latihan" className="mb-8 flex gap-2">
      {tabs.map((t) => (
        <a
          key={t.key}
          href={t.href}
          aria-current={t.key === current ? "page" : undefined}
          className={`flex min-h-11 items-center rounded-full px-5 text-sm font-medium ${t.key === current ? "bg-primary text-on-primary" : "bg-zinc-900 text-zinc-400 shadow-soft hover:text-zinc-50"}`}
        >
          {t.label}
        </a>
      ))}
    </nav>
  );
}
