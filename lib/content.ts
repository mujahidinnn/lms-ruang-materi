import { cacheTag } from "next/cache";
import { publicClient } from "@/lib/supabase/public";
import type { RoadmapEdge, RoadmapNode } from "@/lib/roadmap";
import { slideUrl, type Presentation } from "@/lib/slides";

// Cached reads of published content. RLS on the anon client hides drafts
// and exam_questions; publishing calls updateTag('content').

export type Topic = Presentation & { id: string; summary: string; tips: string[]; practiceCount: number; cardCount: number };

type Row = {
  id: string;
  slug: string;
  title: string;
  description: string;
  summary: string;
  slides: { index: number; path: string; width: number; height: number }[];
  tips: { body: string; position: number }[];
  practice_questions: { count: number }[];
  flashcards: { count: number }[];
};

const SELECT =
  "id, slug, title, description, summary, slides(index, path, width, height), tips(body, position), practice_questions(count), flashcards(count)";

function toTopic(row: Row): Topic {
  const slides = row.slides
    .toSorted((a, b) => a.index - b.index)
    .map(({ path, ...s }) => ({ ...s, src: slideUrl(path) }));
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    summary: row.summary,
    slideCount: slides.length,
    slides,
    tips: row.tips.toSorted((a, b) => a.position - b.position).map((t) => t.body),
    practiceCount: row.practice_questions[0]?.count ?? 0,
    cardCount: row.flashcards[0]?.count ?? 0,
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

export type TrackSummary = { slug: string; title: string; description: string; nodeCount: number };
export type Track = Omit<TrackSummary, "nodeCount"> & { nodes: RoadmapNode[]; edges: RoadmapEdge[] };

type TrackRow = {
  slug: string;
  title: string;
  description: string;
  track_nodes: {
    id: string;
    optional: boolean;
    position: number;
    topics: { id: string; slug: string; title: string; summary: string; practice_questions: { count: number }[]; flashcards: { count: number }[]; exams: unknown };
    track_edges: { to_node_id: string }[];
  }[];
};

const TRACK_SELECT =
  "slug, title, description, track_nodes(id, optional, position, topics(id, slug, title, summary, practice_questions(count), flashcards(count), exams(id)), track_edges!track_edges_from_node_id_fkey(to_node_id))";

function toTrack(row: TrackRow): Track {
  const nodes = row.track_nodes.map((n) => ({
    id: n.id,
    topicId: n.topics.id,
    slug: n.topics.slug,
    title: n.topics.title,
    summary: n.topics.summary,
    optional: n.optional,
    position: n.position,
    practiceCount: n.topics.practice_questions[0]?.count ?? 0,
    cardCount: n.topics.flashcards[0]?.count ?? 0,
    hasExam: !!n.topics.exams,
  }));
  // RLS already hides edges to unpublished nodes; this only guards a stale read.
  const ids = new Set(nodes.map((n) => n.id));
  const edges = row.track_nodes.flatMap((n) =>
    n.track_edges.filter((e) => ids.has(e.to_node_id)).map((e) => ({ from: n.id, to: e.to_node_id }))
  );
  return { slug: row.slug, title: row.title, description: row.description, nodes, edges };
}

export async function getTracks(): Promise<TrackSummary[]> {
  "use cache";
  cacheTag("content");

  const { data, error } = await publicClient
    .from("tracks")
    .select("slug, title, description, track_nodes(count)")
    .order("created_at");
  if (error) throw new Error(`getTracks: ${error.message}`);
  return data
    .map((t) => ({ slug: t.slug, title: t.title, description: t.description, nodeCount: t.track_nodes[0]?.count ?? 0 }))
    .filter((t) => t.nodeCount > 0);
}

export async function getTrack(slug: string): Promise<Track | null> {
  "use cache";
  cacheTag("content");

  const { data, error } = await publicClient.from("tracks").select(TRACK_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw new Error(`getTrack: ${error.message}`);
  const track = data ? toTrack(data as unknown as TrackRow) : null;
  return track && track.nodes.length > 0 ? track : null;
}

export type Question = {
  id: string;
  type: "pilihan_ganda" | "benar_salah" | "baca_kode";
  prompt: string;
  code: string | null;
  options: string[];
  answer: number;
  explanation: string;
};
export type Flashcard = { id: string; front: string; back: string };
type TopicRef = { id: string; slug: string; title: string };

// Practice keys are public on purpose: latihan gives instant feedback.
export async function getPractice(slug: string): Promise<(TopicRef & { questions: Question[]; hasExam: boolean }) | null> {
  "use cache";
  cacheTag("content");

  const { data, error } = await publicClient
    .from("topics")
    .select("id, slug, title, exams(id), practice_questions(id, type, prompt, code, options, answer, explanation)")
    .eq("slug", slug)
    .order("created_at", { referencedTable: "practice_questions" })
    .maybeSingle();
  if (error) throw new Error(`getPractice: ${error.message}`);
  if (!data) return null;
  const { practice_questions: questions, exams, ...topic } = data as TopicRef & { practice_questions: Question[]; exams: unknown };
  // RLS returns the exam only when it is published.
  return { ...topic, questions, hasExam: !!exams };
}

export async function getDeck(slug: string): Promise<(TopicRef & { cards: Flashcard[] }) | null> {
  "use cache";
  cacheTag("content");

  const { data, error } = await publicClient
    .from("topics")
    .select("id, slug, title, flashcards(id, front, back)")
    .eq("slug", slug)
    .order("position", { referencedTable: "flashcards" })
    .maybeSingle();
  if (error) throw new Error(`getDeck: ${error.message}`);
  if (!data) return null;
  const { flashcards: cards, ...topic } = data as TopicRef & { flashcards: Flashcard[] };
  return { ...topic, cards };
}
