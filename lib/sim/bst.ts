export type Tree = { v: number; l: Tree | null; r: Tree | null } | null;
export const CAP = 15;

export const insert = (t: Tree, v: number): Tree =>
  !t ? { v, l: null, r: null } : v < t.v ? { ...t, l: insert(t.l, v) } : v > t.v ? { ...t, r: insert(t.r, v) } : t;

export const inorder = (t: Tree): number[] => (t ? [...inorder(t.l), t.v, ...inorder(t.r)] : []);
export const size = (t: Tree): number => (t ? 1 + size(t.l) + size(t.r) : 0);
export const has = (t: Tree, v: number): boolean => (!t ? false : v === t.v ? true : has(v < t.v ? t.l : t.r, v));

export type BStep = { node: number | null; text: string };

// One step per node on the way down, then a closing step (found / not found / inserted).
export function trace(t: Tree, v: number, kind: "insert" | "search"): BStep[] {
  const steps: BStep[] = [];
  let n: Tree = t;
  if (!n) {
    return [{ node: null, text: kind === "insert" ? `Tree kosong: ${v} menjadi akar.` : "Tree kosong: tidak ada yang dicari." }];
  }
  while (n) {
    if (v === n.v) {
      steps.push({ node: n.v, text: `${v} sama dengan ${n.v}: ${kind === "search" ? "ditemukan." : "sudah ada, tidak disisipkan."}` });
      return steps;
    }
    const left: boolean = v < n.v;
    const next: Tree = left ? n.l : n.r;
    steps.push({ node: n.v, text: `${v} ${left ? "<" : ">"} ${n.v}: ke ${left ? "kiri" : "kanan"}.` });
    if (!next) {
      steps.push({ node: null, text: kind === "insert" ? `Tempat kosong di ${left ? "kiri" : "kanan"} ${n.v}: ${v} disisipkan di sini.` : `Mentok di ujung: ${v} tidak ada di tree.` });
      return steps;
    }
    n = next;
  }
  return steps;
}

export type Placed = { v: number; x: number; y: number; px?: number; py?: number };

// x = in-order rank (so the layout never overlaps), y = depth.
export function layout(t: Tree, W = 360, r = 14): { nodes: Placed[]; H: number } {
  const order = inorder(t);
  const n = order.length;
  const dx = n > 1 ? (W - 2 * r - 8) / (n - 1) : 0;
  const nodes: Placed[] = [];
  let maxD = 0;
  const walk = (s: Tree, d: number, p?: Placed) => {
    if (!s) return;
    maxD = Math.max(maxD, d);
    const me: Placed = { v: s.v, x: n > 1 ? r + 4 + order.indexOf(s.v) * dx : W / 2, y: 28 + d * 46, px: p?.x, py: p?.y };
    nodes.push(me);
    walk(s.l, d + 1, me);
    walk(s.r, d + 1, me);
  };
  walk(t, 0);
  return { nodes, H: Math.max(120, 56 + maxD * 46) };
}
