import type { APIRoute } from "astro";
import { getTopics, getTracks } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

type Entry = { url: string; changeFrequency: string; priority: number };

export const GET: APIRoute = async () => {
  const [presentations, tracks] = await Promise.all([getTopics(), getTracks()]);

  const entries: Entry[] = [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/privasi`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/roadmap`, changeFrequency: "weekly", priority: 0.9 },
    ...tracks.map((track) => ({ url: `${SITE_URL}/roadmap/${track.slug}`, changeFrequency: "weekly", priority: 0.9 })),
    ...presentations
      .filter((presentation) => presentation.practiceCount > 0)
      .map((presentation) => ({ url: `${SITE_URL}/latihan/${presentation.slug}`, changeFrequency: "monthly", priority: 0.6 })),
    ...presentations.map((presentation) => ({ url: `${SITE_URL}/belajar/${presentation.slug}`, changeFrequency: "yearly", priority: 0.8 })),
    ...presentations.flatMap((p) =>
      p.chapters.map((c) => ({ url: `${SITE_URL}/belajar/${p.slug}/${c.slug}`, changeFrequency: "monthly", priority: 0.7 }))
    ),
  ];

  // Slugs are URL-safe, but escape anyway so a stray & cannot break the XML.
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `<url><loc>${esc(e.url)}</loc><changefreq>${e.changeFrequency}</changefreq><priority>${e.priority}</priority></url>`).join("\n")}
</urlset>
`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" },
  });
};
