export type Pos = "static" | "relative" | "absolute" | "fixed" | "sticky";

// Paint order bottom to top. z-index only counts for positioned elements;
// positioned ones paint over static ones, ties go to the later in the DOM.
export function paintOrder(cards: { pos: Pos; z: number }[]): number[] {
  const key = (c: { pos: Pos; z: number }) => (c.pos === "static" ? [0, 0] : [1, c.z]);
  return cards
    .map((c, i) => ({ i, k: key(c) }))
    .sort((a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1] || a.i - b.i)
    .map((x) => x.i);
}

export const EASINGS = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
  "cubic-bezier(.68,-.55,.27,1.55)": [0.68, -0.55, 0.27, 1.55],
} as const;
export type Easing = keyof typeof EASINGS;

// Progress y for time x on a CSS cubic-bezier (Newton + bisection fallback).
export function bezier(t: readonly number[], x: number): number {
  const [x1, y1, x2, y2] = t;
  const f = (a: number, b: number, c: number, s: number) => 3 * a * (1 - s) ** 2 * s + 3 * b * (1 - s) * s * s + s ** 3 * c;
  let lo = 0, hi = 1, s = x;
  for (let n = 0; n < 30; n++) {
    s = (lo + hi) / 2;
    if (f(x1, x2, 1, s) < x) lo = s; else hi = s;
  }
  return f(y1, y2, 1, s);
}
