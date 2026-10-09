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
