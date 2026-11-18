import type { Slide } from "@/lib/slides";

// Pure helpers for chapters: slide embeds, quiz completion, navigation.

// `![keterangan](slide:12)` in a chapter body embeds slide 12.
export function parseSlideRef(src: string): number | null {
  const m = /^slide:(\d+)$/.exec(src);
  const n = m ? Number(m[1]) : 0;
  return n >= 1 ? n : null;
}

// `![keterangan](gambar:nama)` embeds public/praktik/<nama>.svg (made by
// scripts/praktik.mjs). Names are lowercase words joined by hyphens, so a
// source can never point anywhere else.
const DIAGRAM_NAME = "[a-z0-9]+(?:-[a-z0-9]+)*";

export function parseDiagramRef(src: string): string | null {
  return new RegExp(`^gambar:(${DIAGRAM_NAME})$`).exec(src)?.[1] ?? null;
}

// `![judul](sim:nama)` embeds an interactive simulation, a component named in
// components/belajar/sim/index.ts.
export function parseSimRef(src: string): string | null {
  return new RegExp(`^sim:(${DIAGRAM_NAME})$`).exec(src)?.[1] ?? null;
}

export function diagramSrc(name: string): string {
  return `/praktik/${name}.svg`;
}

const diagramRefs = (body: string) => [...body.matchAll(/\]\(gambar:([^)\s]*)\)/g)].map((m) => m[1]);

export function diagramCount(body: string): number {
  return diagramRefs(body).length;
}

// Names a body refers to that do not exist (invalid names count as missing).
export function missingDiagrams(body: string, exists: (name: string) => boolean): string[] {
  const missing = diagramRefs(body).filter((n) => parseDiagramRef(`gambar:${n}`) === null || !exists(n));
  return [...new Set(missing)];
}

export function resolveSlideRef(src: string, slides: Slide[]): Slide | null {
  const n = parseSlideRef(src);
  return n === null ? null : slides.find((s) => s.index === n) ?? null;
}

// Done when every question is answered correctly. A chapter without a quiz
// is finished with its own button instead.
export function quizDone(questions: { id: string; answer: number }[], answers: Record<string, number>): boolean {
  return questions.length > 0 && questions.every((q) => answers[q.id] === q.answer);
}

export function neighbors<T extends { slug: string }>(list: T[], slug: string): { prev: T | null; next: T | null } {
  const i = list.findIndex((c) => c.slug === slug);
  return { prev: i > 0 ? list[i - 1] : null, next: i >= 0 && i < list.length - 1 ? list[i + 1] : null };
}

export function totalMinutes(list: { estMinutes: number }[]): number {
  return list.reduce((sum, c) => sum + c.estMinutes, 0);
}

// Status for a chapter an admin adds. A topic without chapters, or one with
// drafts, gets a draft (Terbitkan publishes it). Only when live chapters
// already exist does it go live too: a lone draft next to them would make
// publish_topic replace the whole published set with it.
export function newChapterStatus(rows: { status: string }[]): "draft" | "published" {
  return rows.length > 0 && rows.every((c) => c.status !== "draft") ? "published" : "draft";
}
