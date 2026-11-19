import { expect, test } from "vitest";
import { add, commit as acommit, canPush, initAreas, edit, pull, push, teammate } from "./git-areas";
import { canMerge, canRebase, commit, initGraph, live, merge, newBranch, rebase, switchTo, tip } from "./git-graph";

test("merge: fast-forward then two-parent commit", () => {
  let g = newBranch(initGraph());
  g = commit(g);
  g = switchTo(g, "main");
  expect(canMerge(g, "main")).toBe(false);
  const ff = merge(g, "fitur-login");
  expect(ff.commits.length).toBe(g.commits.length);
  expect(tip(ff, "main")).toBe(tip(g, "fitur-login"));
  g = commit(g);
  g = merge(g, "fitur-login");
  expect(g.commits.at(-1)?.parents.length).toBe(2);
});

test("rebase replays with new hashes and old ones die", () => {
  let g = newBranch(initGraph());
  g = commit(commit(g));
  const olds = g.commits.slice(1).map((c) => c.id);
  g = commit(switchTo(g, "main"));
  g = switchTo(g, "fitur-login");
  expect(canRebase(g)).toBe(true);
  g = rebase(g);
  expect(canRebase(g)).toBe(false);
  const l = live(g);
  olds.forEach((o) => expect(l.has(o)).toBe(false));
  expect(g.commits.length).toBe(1 + 2 + 1 + 2);
});

test("areas: add, commit, push, rejected push then pull", () => {
  let a = edit(initAreas(), "app.js");
  a = acommit(add(a, "app.js"));
  expect(canPush(a)).toBe(true);
  a = push(a);
  expect(canPush(a)).toBe(false);
  a = teammate(a);
  a = acommit(add(edit(a, "app.js"), "app.js"));
  expect(push(a).err).toBe(true);
  expect(pull(a).err).toBe(false);
});
