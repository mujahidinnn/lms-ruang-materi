import { expect, test } from "vitest";
import { roundRobin } from "./scheduler";

test("round robin matches the chapter example", () => {
  const r = roundRobin([{ name: "A", burst: 5 }, { name: "B", burst: 3 }, { name: "C", burst: 2 }], 2);
  expect(r.slices.map((s) => `${s.name}${s.end - s.start}`)).toEqual(["A2", "B2", "C2", "A2", "B1", "A1"]);
  expect(r.stats.map((s) => s.waiting)).toEqual([5, 6, 4]);
  expect(r.avgWaiting).toBe(5);
});

test("big quantum degrades to FCFS", () => {
  const r = roundRobin([{ name: "A", burst: 5 }, { name: "B", burst: 3 }], 99);
  expect(r.stats.map((s) => s.waiting)).toEqual([0, 5]);
});
