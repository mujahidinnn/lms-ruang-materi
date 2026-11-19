import { describe, expect, it } from "vitest";
import { PRESETS, run } from "./scope-hoisting";

describe("scope-hoisting", () => {
  it("var undefined, let TDZ, lalu ReferenceError", () => {
    const s = run(PRESETS[0]);
    expect(s[0].scopes[0].vars.map((v) => v.st)).toEqual(["undef", "tdz"]);
    expect(s[1].out).toEqual(["undefined"]);
    expect(s.at(-1)!.err).toMatch(/ReferenceError/);
  });
  it("closure menjaga scope, blok dibuang", () => {
    const s = run(PRESETS[2]);
    expect(s[3].scopes.find((x) => x.name === "buatPenghitung()")!.kept).toBe(true);
    expect(s[5].out).toEqual(["1", "2"]);
    expect(s[7].scopes.some((x) => x.name === "blok { }")).toBe(false);
  });
  it("setiap preset berakhir error dan step pertama adalah creation", () => {
    for (const p of PRESETS) { const s = run(p); expect(s[0].phase).toBe("creation"); expect(s.at(-1)!.err).toBeTruthy(); }
  });
});
