export type TemplateEntry = {
  slug: string;
  title: string;
  description: string;
  file: string;
  preview: string;
  tags: string[];
};

// Hand-maintained: add a new entry here whenever an .html is dropped into
// public/templates/, plus a 16:9 screenshot in public/template-previews/.
// Order below is the display order on the site.
export const templates: TemplateEntry[] = [
  {
    slug: "glassmorphism",
    title: "Portfolio Glassmorphism",
    description:
      "Template portfolio dengan efek kaca buram, latar gradien, dan kartu transparan yang modern.",
    file: "portfolio_glassmorphism.html",
    preview: "/template-previews/glassmorphism.avif",
    tags: ["HTML", "CSS", "JavaScript"],
  },
  {
    slug: "luxury",
    title: "Portfolio Luxury",
    description:
      "Template portfolio eksklusif bernuansa elegan dengan tipografi serif dan kursor kustom.",
    file: "portfolio_luxury.html",
    preview: "/template-previews/luxury.avif",
    tags: ["HTML", "CSS", "JavaScript"],
  },
  {
    slug: "neobrutalism",
    title: "Portfolio Neobrutalism",
    description:
      "Template portfolio berani dengan border tebal, warna kontras, dan bayangan solid.",
    file: "portfolio_neobrutalism.html",
    preview: "/template-previews/neobrutalism.avif",
    tags: ["HTML", "CSS", "JavaScript"],
  },
];
