import { expect, test } from "vitest";
import { redundant, stepTables } from "./normalisasi";

const dups = (s: number) => stepTables(s).reduce((n, tb) => n + redundant(tb).size, 0);

test("redundancy shrinks to zero by 3NF", () => {
  expect(dups(1)).toBe(5);
  expect(dups(2)).toBe(1);
  expect(dups(3)).toBe(0);
});

test("splitting loses no orders", () => {
  expect(stepTables(0)[0].rows).toHaveLength(3);
  expect(stepTables(1)[0].rows).toHaveLength(4);
  const [pel, pes, pro, item] = stepTables(3);
  expect([pel.rows.length, pes.rows.length, pro.rows.length, item.rows.length]).toEqual([2, 3, 2, 4]);
});
