export type Mode = "bfs" | "dfs";
export type GStep = {
  current: string | null;
  box: string[]; // queue front-first, or stack bottom-first
  visited: string[]; // visit order
  edges: [string, string][]; // edges walked in this step
  text: string;
};

export const NODES = [
  { id: "A", x: 160, y: 30 }, { id: "B", x: 75, y: 90 }, { id: "C", x: 245, y: 90 }, { id: "D", x: 40, y: 160 },
  { id: "E", x: 135, y: 160 }, { id: "F", x: 260, y: 160 }, { id: "G", x: 90, y: 225 }, { id: "H", x: 215, y: 225 },
];
export const EDGES: [string, string][] = [
  ["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["D", "G"], ["E", "G"], ["F", "H"], ["G", "H"],
];
export const ADJ: Record<string, string[]> = Object.fromEntries(NODES.map((n) => [n.id, [] as string[]]));
for (const [a, b] of EDGES) { ADJ[a].push(b); ADJ[b].push(a); }
for (const k in ADJ) ADJ[k].sort();

const list = (xs: string[]) => xs.join(", ");

export function traverse(adj: Record<string, string[]>, start: string, mode: Mode): GStep[] {
  const visited: string[] = [];
  const box = [start];
  const seen = new Set([start]); // BFS marks on enqueue
  const steps: GStep[] = [];
  const push = (current: string | null, edges: [string, string][], text: string) =>
    steps.push({ current, box: [...box], visited: [...visited], edges, text });
  const name = mode === "bfs" ? "queue" : "stack";
  push(null, [], `Mulai: masukkan ${start} ke ${name}.`);
  while (box.length) {
    const cur = mode === "bfs" ? box.shift()! : box.pop()!;
    if (visited.includes(cur)) {
      push(cur, [], `${cur} sudah dikunjungi, lewati.`);
      continue;
    }
    visited.push(cur);
    const fresh = adj[cur].filter((n) => (mode === "bfs" ? !seen.has(n) : !visited.includes(n)));
    fresh.forEach((n) => seen.add(n));
    // DFS pushes in reverse so the alphabetically first neighbour is popped first.
    box.push(...(mode === "bfs" ? fresh : [...fresh].reverse()));
    const take = mode === "bfs" ? "depan queue" : "puncak stack";
    push(cur, fresh.map((n) => [cur, n]),
      `Ambil ${cur} dari ${take}, kunjungan ke-${visited.length}. ` + (fresh.length ? `Masukkan ${list(fresh)} ke ${name}.` : "Tidak ada tetangga baru."));
  }
  push(null, [], `${name[0].toUpperCase()}${name.slice(1)} kosong: semua simpul terjangkau sudah dikunjungi.`);
  return steps;
}
