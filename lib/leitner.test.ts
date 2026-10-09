import { describe, expect, it } from "vitest";
import { daysFor, nextBox } from "./leitner";

describe("leitner", () => {
  it("starts a new card in box 1, or box 2 when known", () => {
    expect(nextBox(null, 1)).toBe(1);
    expect(nextBox(null, 2)).toBe(1);
    expect(nextBox(null, 3)).toBe(2);
  });

  it("Lupa resets, Sulit keeps, Bisa moves up to 5", () => {
    expect(nextBox(4, 1)).toBe(1);
    expect(nextBox(4, 2)).toBe(4);
    expect(nextBox(4, 3)).toBe(5);
    expect(nextBox(5, 3)).toBe(5);
  });

  it("is due after 1, 2, 4, 8, 16 days", () => {
    expect([1, 2, 3, 4, 5].map(daysFor)).toEqual([1, 2, 4, 8, 16]);
  });
});
