import { expect, test } from "vitest";
import { SCENARIOS, scoreFlags } from "./phishing";

const [phish, sah] = SCENARIOS;

test("perfect, partial, and false-alarm scoring", () => {
  const flags = phish.spots.filter((s) => s.flag).map((s) => s.id);
  expect(scoreFlags(phish, flags)).toMatchObject({ score: 100, missed: [], falseAlarms: [] });
  expect(scoreFlags(phish, ["link"])).toMatchObject({ hits: ["link"], score: 20 });
  expect(scoreFlags(phish, [...flags, "greeting"]).falseAlarms).toEqual(["greeting"]);
  expect(scoreFlags(phish, ["greeting"]).score).toBe(0);
});

test("legitimate email has no red flags", () => {
  expect(sah.spots.some((s) => s.flag)).toBe(false);
  expect(scoreFlags(sah, [])).toMatchObject({ score: 100 });
  expect(scoreFlags(sah, ["link"])).toMatchObject({ score: 0, falseAlarms: ["link"] });
});

test("ids unique and every scenario spot has copy", () => {
  for (const s of SCENARIOS) {
    expect(new Set(s.spots.map((x) => x.id)).size).toBe(s.spots.length);
    for (const x of s.spots) expect(x.why.length).toBeGreaterThan(10);
  }
});
