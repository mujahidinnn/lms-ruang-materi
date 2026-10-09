import { cacheTag } from "next/cache";
import { publicClient } from "@/lib/supabase/public";
import { slideUrl, type Presentation } from "@/lib/slides";

// Cached reads of published content. RLS on the anon client hides drafts
// and exam_questions; publishing calls updateTag('content').

export type Topic = Presentation & { summary: string; tips: string[] };

type Row = {
  slug: string;
  title: string;
  description: string;
  summary: string;
  slides: { index: number; path: string; width: number; height: number }[];
  tips: { body: string; position: number }[];
};

const SELECT =
  "slug, title, description, summary, slides(index, path, width, height), tips(body, position)";

function toTopic(row: Row): Topic {
  const slides = row.slides
    .toSorted((a, b) => a.index - b.index)
    .map(({ path, ...s }) => ({ ...s, src: slideUrl(path) }));
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    summary: row.summary,
    slideCount: slides.length,
    slides,
    tips: row.tips.toSorted((a, b) => a.position - b.position).map((t) => t.body),
  };
}

export async function getTopics(): Promise<Topic[]> {
  "use cache";
  cacheTag("content");

  const { data, error } = await publicClient.from("topics").select(SELECT).order("created_at");
  if (error) throw new Error(`getTopics: ${error.message}`);
  // A topic without published slides cannot render, leave it out.
  return (data as Row[]).map(toTopic).filter((t) => t.slideCount > 0);
}

export async function getTopic(slug: string): Promise<Topic | null> {
  "use cache";
  cacheTag("content");

  const { data, error } = await publicClient.from("topics").select(SELECT).eq("slug", slug).maybeSingle();
  if (error) throw new Error(`getTopic: ${error.message}`);
  const topic = data ? toTopic(data as Row) : null;
  return topic && topic.slideCount > 0 ? topic : null;
}
