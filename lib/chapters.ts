import type { Slide } from "@/lib/slides";

// Pure helpers for chapters: slide embeds, quiz completion, navigation.

// `![keterangan](slide:12)` in a chapter body embeds slide 12.
export function parseSlideRef(src: string): number | null {
  const m = /^slide:(\d+)$/.exec(src);
  const n = m ? Number(m[1]) : 0;
  return n >= 1 ? n : null;
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
