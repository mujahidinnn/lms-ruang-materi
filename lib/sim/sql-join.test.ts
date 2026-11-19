import { expect, test } from "vitest";
import { join } from "./sql-join";

test("sql joins keep the right unmatched rows", () => {
  const L = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const R = [{ k: 1 }, { k: 1 }, { k: null }];
  const j = (t: "INNER" | "LEFT" | "RIGHT" | "FULL") => join(t, L, R, (l) => l.id, (r) => r.k);
  expect(j("INNER")).toEqual([{ l: 0, r: 0 }, { l: 0, r: 1 }]);
  expect(j("LEFT")).toEqual([{ l: 0, r: 0 }, { l: 0, r: 1 }, { l: 1, r: null }, { l: 2, r: null }]);
  expect(j("RIGHT")).toEqual([{ l: 0, r: 0 }, { l: 0, r: 1 }, { l: null, r: 2 }]);
  expect(j("FULL")).toHaveLength(5);
});

import { ADJ, traverse } from "./graph";
import { inorder, insert, layout, size, trace as bstTrace, type Tree } from "./bst";
import { trace as csTrace } from "./call-stack";
import { add, remove, type SQ } from "./stack-queue";

test("bfs and dfs visit order", () => {
  expect(traverse(ADJ, "A", "bfs").at(-1)!.visited.join("")).toBe("ABCDEFGH");
  expect(traverse(ADJ, "A", "dfs").at(-1)!.visited.join("")).toBe("ABDGEHFC");
  expect(traverse(ADJ, "H", "bfs").at(-1)!.visited).toHaveLength(8);
});

test("bst insert, trace, inorder, layout", () => {
  let t: Tree = null;
  for (const v of [8, 3, 10, 1, 6, 14, 3]) t = insert(t, v);
  expect(inorder(t)).toEqual([1, 3, 6, 8, 10, 14]);
  expect(size(t)).toBe(6);
  expect(bstTrace(t, 6, "search").map((s) => s.node)).toEqual([8, 3, 6]);
  expect(bstTrace(t, 7, "insert").map((s) => s.node)).toEqual([8, 3, 6, null]);
  expect(new Set(layout(t).nodes.map((n) => n.x)).size).toBe(6);
});

test("call stack traces", () => {
  const f = csTrace("faktorial", 4);
  expect(Math.max(...f.map((s) => s.stack.length))).toBe(4);
  expect(f.at(-1)!.text).toContain("= 24");
  expect(f.filter((s) => s.kind === "base")).toHaveLength(1);
  expect(csTrace("fibonacci", 5).at(-1)!.text).toContain("= 5");
  expect(csTrace("fibonacci", 5).filter((s) => s.kind === "base")).toHaveLength(8);
});

test("stack vs queue order and limits", () => {
  let s: SQ = { stack: [], queue: [] };
  for (const v of ["A", "B", "C"]) s = add(s, v).state;
  const r = remove(s);
  expect(r.out).toEqual({ stack: "C", queue: "A" });
  expect(add({ stack: "123456".split(""), queue: "123456".split("") }, "7").ok).toBe(false);
  expect(remove({ stack: [], queue: [] }).ok).toBe(false);
});
