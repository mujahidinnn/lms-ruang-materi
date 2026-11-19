import { expect, test } from "vitest";
import { bitDiff, bitDiffPercent, changeOneChar, diffIndexes, sha256Hex } from "./hash";

test("sha256 reference vectors", async () => {
  expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  expect(await sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
});

test("bit diff", () => {
  expect(bitDiff("00", "ff")).toBe(8);
  expect(bitDiff("0f", "0f")).toBe(0);
  expect(bitDiffPercent("00", "0f")).toBe(50);
  expect([...diffIndexes("abc", "adc")]).toEqual([1]);
});

test("changeOneChar changes exactly one char", () => {
  for (const [t, n] of [["halo", 0], ["halo", 5], ["zZ9", 1], ["!", 0], ["", 0]] as const) {
    const o = changeOneChar(t, n);
    expect(o).not.toBe(t);
    if (t) expect([...o].filter((c, i) => c !== t[i]).length).toBe(1);
  }
});

test("avalanche is near 50%", async () => {
  const p = bitDiffPercent(await sha256Hex("halo dunia"), await sha256Hex("hali dunia"));
  expect(p).toBeGreaterThan(35);
  expect(p).toBeLessThan(65);
});
