import { expect, test } from "vitest";
import { classString, px, rem, styleOf, type Cfg } from "./tailwind";

const c: Cfg = { p: 4, m: 0, w: "w-48", bgHue: "blue", bg: 500, text: "white", rounded: "rounded-lg" };

test("skala 4px per unit", () => {
  expect(px(4)).toBe(16);
  expect(rem(6)).toBe(1.5);
});
test("class string dan style konsisten", () => {
  expect(classString(c)).toBe("p-4 w-48 bg-blue-500 text-white rounded-lg");
  expect(classString({ ...c, m: 2, text: 900 })).toContain("m-2");
  expect(classString({ ...c, text: 900 })).toContain("text-blue-900");
  expect(styleOf(c)).toMatchObject({ padding: 16, width: 192, background: "#3b82f6", borderRadius: 8 });
});
