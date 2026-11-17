// Orders classes the way a learner meets them: roadmap by roadmap (in the
// order given), each by node position; a class on several roadmaps stays at
// its first place. Classes on no roadmap keep their incoming order, last.
export function inPathOrder<T extends { slug: string }>(topics: T[], tracks: { nodes: { slug: string; position: number }[] }[]): T[] {
  const rank = new Map<string, number>();
  for (const t of tracks) for (const n of t.nodes.toSorted((a, b) => a.position - b.position)) if (!rank.has(n.slug)) rank.set(n.slug, rank.size);
  return topics.toSorted((a, b) => (rank.get(a.slug) ?? Infinity) - (rank.get(b.slug) ?? Infinity));
}
