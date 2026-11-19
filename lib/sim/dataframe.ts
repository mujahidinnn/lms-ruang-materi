import { join } from "./sql-join";

export type Agg = "sum" | "mean" | "count";
export type Group = { key: string; rows: number[]; value: number };

// Splits rows by `by`, in first-appearance order, then applies `agg` to `val` per group.
export function groupAgg<T extends Record<string, string | number>>(rows: T[], by: keyof T, val: keyof T, agg: Agg): Group[] {
  const groups = new Map<string, number[]>();
  rows.forEach((r, i) => groups.set(String(r[by]), [...(groups.get(String(r[by])) ?? []), i]));
  return [...groups].map(([key, idx]) => {
    const sum = idx.reduce((s, i) => s + Number(rows[i][val]), 0);
    return { key, rows: idx, value: agg === "sum" ? sum : agg === "count" ? idx.length : sum / idx.length };
  });
}

export type How = "inner" | "left" | "outer";
export type Pair = { l: number | null; r: number | null };

// pandas-style merge on a string key; unmatched sides come back as null (NaN).
export function merge<L, R>(how: How, left: L[], right: R[], keyL: (l: L) => string, keyR: (r: R) => string): Pair[] {
  const ids = new Map<string, number>();
  const id = (k: string) => ids.get(k) ?? (ids.set(k, ids.size), ids.size - 1);
  return join(how === "outer" ? "FULL" : (how.toUpperCase() as "INNER" | "LEFT"), left, right, (l) => id(keyL(l)), (r) => id(keyR(r)));
}
