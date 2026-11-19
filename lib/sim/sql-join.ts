export type JoinType = "INNER" | "LEFT" | "RIGHT" | "FULL";
export type Pair = { l: number | null; r: number | null };

// Joins by index: left[i] matches right[j] when keyL(left[i]) === keyR(right[j]) (NULL never matches).
export function join<L, R>(type: JoinType, left: L[], right: R[], keyL: (l: L) => number | null, keyR: (r: R) => number | null): Pair[] {
  const hit = (i: number, j: number) => keyL(left[i]) !== null && keyL(left[i]) === keyR(right[j]);
  const out: Pair[] = [];
  if (type === "RIGHT") {
    right.forEach((_, j) => {
      const ms = left.map((_, i) => i).filter((i) => hit(i, j));
      if (ms.length) ms.forEach((i) => out.push({ l: i, r: j }));
      else out.push({ l: null, r: j });
    });
    return out;
  }
  const seenR = new Set<number>();
  left.forEach((_, i) => {
    const ms = right.map((_, j) => j).filter((j) => hit(i, j));
    ms.forEach((j) => { seenR.add(j); out.push({ l: i, r: j }); });
    if (!ms.length && type !== "INNER") out.push({ l: i, r: null });
  });
  if (type === "FULL") right.forEach((_, j) => { if (!seenR.has(j)) out.push({ l: null, r: j }); });
  return out;
}
