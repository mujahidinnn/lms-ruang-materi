import type { MetadataRoute } from "next";
import { getTopics, getTracks } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [presentations, tracks] = await Promise.all([getTopics(), getTracks()]);

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
    {
      url: `${SITE_URL}/template`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/roadmap`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...tracks.map((track) => ({
      url: `${SITE_URL}/roadmap/${track.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...presentations
      .filter((presentation) => presentation.practiceCount > 0)
      .map((presentation) => ({
        url: `${SITE_URL}/latihan/${presentation.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ...presentations.map((presentation) => ({
      url: `${SITE_URL}/belajar/${presentation.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
