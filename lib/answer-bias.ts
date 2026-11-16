// Guards against answer keys a learner could guess without reading: the
// correct option is the longest one, or sits at the same position again and
// again. Used by scripts/check-draft.ts. benar_salah questions are ignored.

type Q = { type: string; options: string[]; answer: number };

export const BIAS_LIMIT = 0.4;

const choices = (qs: Q[]) => qs.filter((q) => q.type !== "benar_salah");

// Share of questions whose correct option is as long as the longest (ties count).
export function longestCorrectShare(qs: Q[]): number {
  const list = choices(qs);
  if (!list.length) return 0;
  const hits = list.filter((q) => q.options[q.answer].length === Math.max(...q.options.map((o) => o.length)));
  return hits.length / list.length;
}

// Share held by the most used answer position.
export function maxPositionShare(qs: Q[]): number {
  const list = choices(qs);
  if (!list.length) return 0;
  const counts = new Map<number, number>();
  for (const q of list) counts.set(q.answer, (counts.get(q.answer) ?? 0) + 1);
  return Math.max(...counts.values()) / list.length;
}
