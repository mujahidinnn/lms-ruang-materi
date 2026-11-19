// Pure model of a tiny git commit graph. Branches are pointers; "dead" commits are those no branch reaches.
export const MAX = 16;
export const NAMES = ["fitur-login", "fitur-daftar", "perbaikan-bug"];

export type Commit = { id: string; parents: string[]; lane: number };
export type Graph = {
  commits: Commit[];
  branches: Record<string, string>;
  lanes: Record<string, number>;
  head: string;
  seq: number;
  cmd: string;
  note: string;
};

const hash = (s: string) => {
  let h = 2166136261;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
};

export function initGraph(): Graph {
  const id = hash("0|");
  return { commits: [{ id, parents: [], lane: 0 }], branches: { main: id }, lanes: { main: 0 }, head: "main", seq: 1, cmd: "git init", note: "Repositori baru: satu commit di branch main, HEAD menunjuk ke main." };
}

export const tip = (g: Graph, b: string) => g.branches[b] as string;

export function ancestors(g: Graph, id: string): Set<string> {
  const seen = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const x = stack.pop() as string;
    if (seen.has(x)) continue;
    seen.add(x);
    g.commits.find((c) => c.id === x)?.parents.forEach((p) => stack.push(p));
  }
  return seen;
}

export function live(g: Graph): Set<string> {
  const all = new Set<string>();
  for (const t of Object.values(g.branches)) ancestors(g, t).forEach((x) => all.add(x));
  return all;
}

const mk = (g: Graph, parents: string[], lane: number): [Graph, Commit] => {
  const c: Commit = { id: hash(`${g.seq}|${parents.join(",")}`), parents, lane };
  return [{ ...g, commits: [...g.commits, c], seq: g.seq + 1 }, c];
};

const room = (g: Graph, n = 1) => g.commits.length + n <= MAX;

export const canCommit = (g: Graph) => room(g);
export function commit(g: Graph): Graph {
  const [n, c] = mk(g, [tip(g, g.head)], g.lanes[g.head] as number);
  return { ...n, branches: { ...n.branches, [g.head]: c.id }, cmd: `git commit -m "commit ${g.seq}"`, note: `Commit ${c.id} dibuat; branch ${g.head} ikut maju, HEAD ikut karena menunjuk ${g.head}.` };
}

export const nextName = (g: Graph) => NAMES.find((n) => !(n in g.branches));
export function newBranch(g: Graph): Graph {
  const name = nextName(g);
  if (!name) return g;
  return { ...g, branches: { ...g.branches, [name]: tip(g, g.head) }, lanes: { ...g.lanes, [name]: Object.keys(g.lanes).length }, head: name, cmd: `git switch -c ${name}`, note: `Penunjuk ${name} dibuat di commit yang sama, lalu HEAD pindah ke sana. Belum ada commit baru.` };
}

export const switchTo = (g: Graph, b: string): Graph => ({ ...g, head: b, cmd: `git switch ${b}`, note: `HEAD pindah ke ${b}. Commit berikutnya akan menggeser ${b}.` });

export function canMerge(g: Graph, from: string) {
  if (from === g.head || !(from in g.branches)) return false;
  const a = tip(g, g.head), b = tip(g, from);
  if (ancestors(g, a).has(b)) return false; // already up to date
  return ancestors(g, b).has(a) || room(g);
}
export function merge(g: Graph, from: string): Graph {
  const a = tip(g, g.head), b = tip(g, from);
  const cmd = `git merge ${from}`;
  if (ancestors(g, b).has(a)) return { ...g, branches: { ...g.branches, [g.head]: b }, cmd, note: `Fast-forward: ${g.head} cukup digeser ke ${b}. Tidak ada commit baru.` };
  const [n, c] = mk(g, [a, b], g.lanes[g.head] as number);
  return { ...n, branches: { ...n.branches, [g.head]: c.id }, cmd, note: `Merge commit ${c.id} dibuat dengan dua induk: ${a} dan ${b}. Riwayat kedua jalur tetap utuh.` };
}

const unique = (g: Graph) => {
  const mine = ancestors(g, tip(g, g.head)), base = ancestors(g, tip(g, "main"));
  return g.commits.filter((c) => mine.has(c.id) && !base.has(c.id));
};
export function canRebase(g: Graph) {
  if (g.head === "main") return false;
  if (ancestors(g, tip(g, g.head)).has(tip(g, "main"))) return false; // main already in my history
  return room(g, unique(g).length);
}
export function rebase(g: Graph): Graph {
  const lane = g.lanes[g.head] as number;
  const olds = unique(g);
  const cmd = "git rebase main";
  if (!olds.length) return { ...g, branches: { ...g.branches, [g.head]: tip(g, "main") }, cmd, note: `Tidak ada commit untuk diputar ulang, ${g.head} cukup digeser ke ujung main.` };
  let cur = g, prev = tip(g, "main");
  for (let i = 0; i < olds.length; i++) { const [n, c] = mk(cur, [prev], lane); cur = n; prev = c.id; }
  return { ...cur, branches: { ...cur.branches, [g.head]: prev }, cmd, note: `${olds.length} commit diputar ulang di atas main. Isinya sama, tapi hash baru karena induknya beda. Commit lama memudar.` };
}
