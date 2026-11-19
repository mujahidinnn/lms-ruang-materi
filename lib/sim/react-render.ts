export type NodeId = "App" | "Header" | "Counter" | "List" | "Item1" | "Item2";
export const NODES: { id: NodeId; parent: NodeId | null; propsFromParentState: boolean }[] = [
  { id: "App", parent: null, propsFromParentState: false },
  { id: "Header", parent: "App", propsFromParentState: false },
  { id: "Counter", parent: "App", propsFromParentState: true }, // menerima prop count dari App
  { id: "List", parent: "App", propsFromParentState: false },
  { id: "Item1", parent: "List", propsFromParentState: false },
  { id: "Item2", parent: "List", propsFromParentState: false },
];
export type Memo = Partial<Record<NodeId, boolean>>;

/** Komponen mana yang render setelah `owner` mengubah state-nya, dan mana yang dilewati memo. */
export function rerender(owner: NodeId, memo: Memo) {
  const rendered = new Set<NodeId>([owner]);
  const skipped = new Set<NodeId>();
  for (const n of NODES) {
    if (!n.parent || n.id === owner || !rendered.has(n.parent)) continue;
    // props berubah hanya jika parent adalah pemilik state dan anak memakai state itu
    const propsChanged = n.propsFromParentState && n.parent === owner;
    if (memo[n.id] && !propsChanged) skipped.add(n.id);
    else rendered.add(n.id);
  }
  return { rendered, skipped };
}
