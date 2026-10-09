import { describe, expect, it } from "vitest";
import { shuffleOptions } from "./quiz";

const q = (id: string, answer = 1) => ({ id, type: "pilihan_ganda", options: ["a", "b", "c", "d"], answer });

describe("shuffleOptions", () => {
  it("keeps the same answer text and options", () => {
    const s = shuffleOptions(q("x1"));
    expect(s.options.toSorted()).toEqual(["a", "b", "c", "d"]);
    expect(s.options[s.answer]).toBe("b");
  });

  it("is stable per id and spreads keys across positions", () => {
    expect(shuffleOptions(q("x1"))).toEqual(shuffleOptions(q("x1")));
    const positions = new Set(Array.from({ length: 40 }, (_, i) => shuffleOptions(q(`id-${i}`)).answer));
    expect(positions.size).toBe(4);
  });

  it("leaves benar/salah alone", () => {
    const bs = { id: "y", type: "benar_salah", options: ["Benar", "Salah"], answer: 0 };
    expect(shuffleOptions(bs)).toBe(bs);
  });
});
