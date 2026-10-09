// Level per track from core topics passed by exam (track_levels view).
// Pemula 0-25%, Dasar 26-50%, Menengah 51-80%, Mahir 81-100%.

const LEVELS = [
  { name: "Pemula", upTo: 25 },
  { name: "Dasar", upTo: 50 },
  { name: "Menengah", upTo: 80 },
  { name: "Mahir", upTo: 100 },
] as const;

export type Level = (typeof LEVELS)[number]["name"];

const pct = (passed: number, total: number) => (total ? (passed / total) * 100 : 0);

export function levelFor(passed: number, total: number): Level {
  const p = pct(passed, total);
  return LEVELS.find((l) => p <= l.upTo)!.name;
}

// The next level and how many more core topics it takes, or null at Mahir.
export function nextLevel(passed: number, total: number): { name: Level; topics: number } | null {
  const i = LEVELS.findIndex((l) => l.name === levelFor(passed, total));
  if (i === LEVELS.length - 1 || !total) return null;
  let need = passed;
  while (pct(need, total) <= LEVELS[i].upTo) need++;
  return { name: LEVELS[i + 1].name, topics: need - passed };
}
