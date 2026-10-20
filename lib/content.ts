import { cached } from "@/lib/cache";
import { publicClient } from "@/lib/supabase/public";
import type { RoadmapEdge, RoadmapNode } from "@/lib/roadmap";
import { slideUrl, type Presentation } from "@/lib/slides";
import type { Check } from "@/lib/code/check-node";
import type { ExerciseFiles, SandboxKind } from "@/lib/code/sandbox-doc";

// Cached reads of published content (lib/cache.ts). RLS on the anon client
// hides drafts and exam_questions; publishing calls invalidateContent().

export type ChapterSummary = { id: string; slug: string; title: string; position: number; estMinutes: number };
export type ChapterQuestion = {
  id: string;
  type: "pilihan_ganda" | "benar_salah" | "baca_kode";
  prompt: string;
  code: string | null;
  options: string[];
  answer: number;
  explanation: string;
};
export type CodeExerciseData = {
  id: string;
  kind: SandboxKind;
  title: string;
  prompt: string;
  starter: ExerciseFiles;
  solution: ExerciseFiles;
  setup: string;
  tests: Check[];
};
export type Chapter = ChapterSummary & {
  body: string;
  slideFrom: number | null;
  slideTo: number | null;
  questions: ChapterQuestion[];
  exercises: CodeExerciseData[];
};

export type Topic = Presentation & {
  id: string;
  summary: string;
  tips: string[];
  practiceCount: number;
  cardCount: number;
  chapters: ChapterSummary[];
  hasExam: boolean;
};

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
  chapters: { id: string; slug: string; title: string; position: number; est_minutes: number }[];
  // exams.topic_id is unique, so PostgREST embeds one object; RLS returns
  // it only when the exam is published.
  exams: { id: string } | null;
};

const SELECT =
  "id, slug, title, description, summary, slides(index, path, width, height), tips(body, position), practice_questions(count), flashcards(count), chapters(id, slug, title, position, est_minutes), exams(id)";

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
    chapters: row.chapters
      .toSorted((a, b) => a.position - b.position)
      .map((c) => ({ id: c.id, slug: c.slug, title: c.title, position: c.position, estMinutes: c.est_minutes })),
    hasExam: row.exams !== null,
  };
}

export function getTopics(): Promise<Topic[]> {
  return cached(`getTopics`, async () => {
    const { data, error } = await publicClient.from("topics").select(SELECT).order("created_at");
    if (error) throw new Error(`getTopics: ${error.message}`);
    // A topic without published slides cannot render, leave it out.
    return (data as unknown as Row[]).map(toTopic).filter((t) => t.slideCount > 0);
  });
}

export function getTopic(slug: string): Promise<Topic | null> {
  return cached(`getTopic:${JSON.stringify([slug])}`, async () => {
    const { data, error } = await publicClient.from("topics").select(SELECT).eq("slug", slug).maybeSingle();
    if (error) throw new Error(`getTopic: ${error.message}`);
    const topic = data ? toTopic(data as unknown as Row) : null;
    return topic && topic.slideCount > 0 ? topic : null;
  });
}

type ChapterRow = {
  id: string;
  slug: string;
  title: string;
  position: number;
  est_minutes: number;
  body: string;
  slide_from: number | null;
  slide_to: number | null;
  chapter_questions: (ChapterQuestion & { position: number })[];
  code_exercises: (Omit<CodeExerciseData, "kind"> & { kind: string; position: number })[];
};

// Kinds this build can run (sql and git arrive in later phases); an
// exercise without checks is unfinished. Same rule as counted_exercise().
const RUNNABLE = new Set<string>(["web", "js", "express"]);

export function getChapter(topicSlug: string, chapterSlug: string): Promise<Chapter | null> {
  return cached(`getChapter:${JSON.stringify([topicSlug, chapterSlug])}`, async () => {
    const { data, error } = await publicClient
      .from("chapters")
      .select(
        "id, slug, title, position, est_minutes, body, slide_from, slide_to, chapter_questions(id, position, type, prompt, code, options, answer, explanation), code_exercises(id, position, kind, title, prompt, starter, solution, setup, tests), topics!inner(slug)"
      )
      .eq("topics.slug", topicSlug)
      .eq("slug", chapterSlug)
      .maybeSingle();
    if (error) throw new Error(`getChapter: ${error.message}`);
    if (!data) return null;
    const c = data as unknown as ChapterRow;
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      position: c.position,
      estMinutes: c.est_minutes,
      body: c.body,
      slideFrom: c.slide_from,
      slideTo: c.slide_to,
      questions: c.chapter_questions
        .toSorted((a, b) => a.position - b.position)
        .map((q) => ({ id: q.id, type: q.type, prompt: q.prompt, code: q.code, options: q.options, answer: q.answer, explanation: q.explanation })),
      exercises: c.code_exercises
        .filter((e) => RUNNABLE.has(e.kind) && e.tests.length > 0)
        .toSorted((a, b) => a.position - b.position)
        .map((e) => ({ id: e.id, kind: e.kind as SandboxKind, title: e.title, prompt: e.prompt, starter: e.starter, solution: e.solution, setup: e.setup, tests: e.tests })),
    };
  });
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

export function getTracks(): Promise<TrackSummary[]> {
  return cached(`getTracks`, async () => {
    const { data, error } = await publicClient
      .from("tracks")
      .select("slug, title, description, track_nodes(count)")
      .order("created_at");
    if (error) throw new Error(`getTracks: ${error.message}`);
    return data
      .map((t) => ({ slug: t.slug, title: t.title, description: t.description, nodeCount: t.track_nodes[0]?.count ?? 0 }))
      .filter((t) => t.nodeCount > 0);
  });
}

export function getTrack(slug: string): Promise<Track | null> {
  return cached(`getTrack:${JSON.stringify([slug])}`, async () => {
    const { data, error } = await publicClient.from("tracks").select(TRACK_SELECT).eq("slug", slug).maybeSingle();
    if (error) throw new Error(`getTrack: ${error.message}`);
    const track = data ? toTrack(data as unknown as TrackRow) : null;
    return track && track.nodes.length > 0 ? track : null;
  });
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
// chapterQuestions (published chapters' quizzes) and passScore feed the
// exam-prep simulation; the exam bank itself is never read here.
export function getPractice(
  slug: string
): Promise<(TopicRef & { questions: Question[]; chapterQuestions: Question[]; hasExam: boolean; passScore: number | null }) | null> {
  return cached(`getPractice:${slug}`, async () => {
    const { data, error } = await publicClient
      .from("topics")
      .select(
        "id, slug, title, exams(id, pass_score), practice_questions(id, type, prompt, code, options, answer, explanation), chapters(chapter_questions(id, type, prompt, code, options, answer, explanation))"
      )
      .eq("slug", slug)
      .order("created_at", { referencedTable: "practice_questions" })
      .maybeSingle();
    if (error) throw new Error(`getPractice: ${error.message}`);
    if (!data) return null;
    const { practice_questions: questions, exams, chapters, ...topic } = data as unknown as TopicRef & {
      practice_questions: Question[];
      exams: { id: string; pass_score: number } | null;
      chapters: { chapter_questions: Question[] }[];
    };
    // RLS returns the exam only when it is published.
    return {
      ...topic,
      questions,
      chapterQuestions: chapters.flatMap((c) => c.chapter_questions),
      hasExam: !!exams,
      passScore: exams?.pass_score ?? null,
    };
  });
}

export function getDeck(slug: string): Promise<(TopicRef & { cards: Flashcard[] }) | null> {
  return cached(`getDeck:${slug}`, async () => {
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
  });
}
