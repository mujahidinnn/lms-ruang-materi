// Option order for practice questions. Drafted keys cluster on one
// position, so options are shuffled; seeded by the question id so server
// and browser render the same order (no hydration mismatch). Benar/salah
// keeps its order.

type Shufflable = { id: string; type: string; options: string[]; answer: number };

function seed(text: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function shuffleOptions<Q extends Shufflable>(q: Q): Q {
  if (q.type === "benar_salah") return q;
  const rand = seed(q.id);
  const order = q.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
}

// Score of a finished set. Plain practice is a win only when every answer
// is right; exam prep (passScore given) wins at or above the pass score.
export function setResult(correct: number, total: number, passScore?: number): { score: number; win: boolean } {
  const score = total ? Math.round((correct / total) * 100) : 0;
  return { score, win: passScore === undefined ? total > 0 && correct === total : score >= passScore };
}

// n distinct questions in random order (all of them when there are fewer).
// rand is injected so tests are deterministic; callers pass Math.random
// from an event handler, never during render.
export function sampleQuestions<T>(list: T[], n: number, rand: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}
