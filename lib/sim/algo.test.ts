import { expect, test } from "vitest";
import { CLASSES, fmt } from "./bigo";
import { binarySteps, linearSteps } from "./search";
import { KINDS, sortSteps } from "./sorting";

const rand = (n: number, m = 9) => Array.from({ length: n }, () => Math.floor(Math.random() * m));
const asc = (a: number[]) => [...a].sort((x, y) => x - y);

test("every sort ends sorted, keeps the same values, and flags all cells done", () => {
  for (const { id } of KINDS) {
    for (let t = 0; t < 40; t++) {
      const d = rand(t % 15 + 1);
      const last = sortSteps(id, d).at(-1)!;
      expect(last.arr, id).toEqual(asc(d));
      expect(last.done.length).toBe(d.length);
    }
  }
});

test("step counters are monotonic and in-place sorts keep every value (merge overwrites mid-merge)", () => {
  for (const { id } of KINDS) {
    const s = sortSteps(id, [5, 3, 8, 1, 9, 2]);
    s.forEach((x, i) => { if (id !== "merge") expect(asc(x.arr)).toEqual([1, 2, 3, 5, 8, 9]); if (i) { expect(x.cmp).toBeGreaterThanOrEqual(s[i - 1].cmp); expect(x.swp).toBeGreaterThanOrEqual(s[i - 1].swp); } });
  }
});

test("known comparison and swap counts", () => {
  const rev = [5, 4, 3, 2, 1];
  const c = (k: Parameters<typeof sortSteps>[0], d: number[]) => { const l = sortSteps(k, d).at(-1)!; return [l.cmp, l.swp]; };
  expect(c("bubble", rev)).toEqual([10, 10]);
  expect(c("bubble", [1, 2, 3, 4, 5])).toEqual([4, 0]);
  expect(c("selection", [1, 2, 3, 4, 5])[0]).toBe(10);
  expect(c("selection", rev)).toEqual([10, 2]);
  expect(c("insertion", rev)).toEqual([10, 10]);
  expect(c("insertion", [1, 2, 3, 4, 5])).toEqual([4, 0]);
  expect(c("merge", [8, 7, 6, 5, 4, 3, 2, 1])[1]).toBe(24); // n log2 n writes
  expect(c("merge", [1, 2, 3, 4, 5, 6, 7, 8])[0]).toBe(12); // sorted input: n/2 * log2 n
});

test("search finds every present value and reports absent ones", () => {
  const a = Array.from({ length: 16 }, (_, i) => i * 3 + 2);
  a.forEach((v, k) => {
    const b = binarySteps(a, v).at(-1)!;
    expect(b.found).toBe(k);
    expect(b.cmp).toBeLessThanOrEqual(5);
    const l = linearSteps(a, v).at(-1)!;
    expect(l.found).toBe(k);
    expect(l.cmp).toBe(k + 1);
  });
  const nb = binarySteps(a, 4).at(-1)!, nl = linearSteps(a, 4).at(-1)!;
  expect([nb.found, nb.done, nl.found, nl.cmp]).toEqual([-1, true, -1, 16]);
});

test("big-o values and formatting", () => {
  const f = (id: string, n: number) => CLASSES.find((c) => c.id === id)!.f(n);
  expect([f("log", 1024), f("nlog", 1024), f("n2", 1024), f("2n", 10)]).toEqual([10, 10240, 1048576, 1024]);
  expect([fmt(2 ** 60), fmt(1.5e6), fmt(950), fmt(3.3219), fmt(2e9)]).toEqual(["> 1 kuadriliun", "1,5 juta", "950", "3,3", "2 miliar"]);
});
