import type { MetadataRoute } from "next";
import { getTopics } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const presentations = await getTopics();

  return [
    {
      url: SITE_URL,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/privasi`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...presentations.map((presentation) => ({
      url: `${SITE_URL}/belajar/${presentation.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
