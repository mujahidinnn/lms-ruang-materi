// Roadmap graph helpers. Pure, safe in client components.

export type RoadmapNode = {
  id: string;
  topicId: string;
  slug: string;
  title: string;
  summary: string;
  optional: boolean;
  position: number;
  practiceCount: number;
  cardCount: number;
};

export type RoadmapEdge = { from: string; to: string };

export type NodeState = "belum" | "sedang" | "selesai" | "dilewati";

export type PlacedNode = RoadmapNode & { column: number; row: number };

// Columns by longest path from a root, so every prerequisite sits left of
// what needs it. Rows inside a column follow position, then title.
// The database rejects cycles; a node caught in one anyway lands in column 0.
export function layout(nodes: RoadmapNode[], edges: RoadmapEdge[]): PlacedNode[] {
  const column = new Map(nodes.map((n) => [n.id, 0]));
  const incoming = new Map(nodes.map((n) => [n.id, 0]));
  for (const e of edges) incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);

  const queue = nodes.filter((n) => incoming.get(n.id) === 0).map((n) => n.id);
  while (queue.length) {
    const id = queue.shift()!;
    for (const e of edges) {
      if (e.from !== id) continue;
      column.set(e.to, Math.max(column.get(e.to) ?? 0, column.get(id)! + 1));
      incoming.set(e.to, incoming.get(e.to)! - 1);
      if (incoming.get(e.to) === 0) queue.push(e.to);
    }
  }

  const sorted = nodes
    .map((n) => ({ ...n, column: column.get(n.id)!, row: 0 }))
    .toSorted((a, b) => a.column - b.column || a.position - b.position || a.title.localeCompare(b.title));
  const rows = new Map<number, number>();
  for (const n of sorted) {
    n.row = rows.get(n.column) ?? 0;
    rows.set(n.column, n.row + 1);
  }
  return sorted;
}

// Prerequisites not yet done. Advice only, never a lock.
export function openPrerequisites(
  id: string,
  edges: RoadmapEdge[],
  states: Record<string, NodeState>
): string[] {
  return edges
    .filter((e) => e.to === id && states[e.from] !== "selesai" && states[e.from] !== "dilewati")
    .map((e) => e.from);
}
