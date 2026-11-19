import { expect, test } from "vitest";
import { groupAgg, merge } from "./dataframe";

const data = [["Kopi", 3], ["Teh", 1], ["Kopi", 2], ["Roti", 4], ["Teh", 2], ["Kopi", 5], ["Roti", 1], ["Susu", 2]].map(([produk, jumlah]) => ({ produk, jumlah }));

test("groupAgg matches the chapter numbers", () => {
  const g = (a: "sum" | "mean" | "count") => groupAgg(data, "produk", "jumlah", a);
  expect(g("sum").map((x) => x.value)).toEqual([10, 3, 5, 2]);
  expect(g("count").map((x) => x.value)).toEqual([3, 2, 2, 1]);
  expect(g("mean")[0].value).toBeCloseTo(3.33, 2);
  expect(g("sum")[0].rows).toEqual([0, 2, 5]);
});

test("merge inner/left/outer on string keys", () => {
  const produk = [{ k: "K01" }, { k: "T01" }, { k: "R01" }];
  const jual = [{ k: "K01" }, { k: "R01" }, { k: "K01" }, { k: "X99" }];
  const m = (h: "inner" | "left" | "outer") => merge(h, jual, produk, (x) => x.k, (x) => x.k);
  expect(m("inner")).toHaveLength(3);
  expect(m("left")).toHaveLength(4);
  expect(m("left")[3]).toEqual({ l: 3, r: null });
  expect(m("outer")).toHaveLength(5);
  expect(m("outer")[4]).toEqual({ l: null, r: 1 });
});
