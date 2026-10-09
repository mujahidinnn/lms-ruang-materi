import { describe, expect, it } from "vitest";
import { levelFor, nextLevel } from "./level";

describe("level", () => {
  it("follows the 25, 50, 80 percent bands", () => {
    expect([0, 1, 2, 3, 5, 6, 8, 9, 10].map((p) => levelFor(p, 10))).toEqual([
      "Pemula", "Pemula", "Pemula", "Dasar", "Dasar", "Menengah", "Menengah", "Mahir", "Mahir",
    ]);
    expect(levelFor(1, 4)).toBe("Pemula");
    expect(levelFor(0, 0)).toBe("Pemula");
  });

  it("says how many topics the next level needs", () => {
    expect(nextLevel(0, 12)).toEqual({ name: "Dasar", topics: 4 });
    expect(nextLevel(5, 12)).toEqual({ name: "Menengah", topics: 2 });
    expect(nextLevel(12, 12)).toBeNull();
  });
});
