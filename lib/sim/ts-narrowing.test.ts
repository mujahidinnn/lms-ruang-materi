import { expect, test } from "vitest";
import { PRESETS } from "./ts-narrowing";

test("steps point at real lines, errors only on non-narrowed lines", () => {
  for (const p of PRESETS) {
    expect(p.steps.length).toBeGreaterThan(2);
    for (const s of p.steps) {
      expect(s.line).toBeGreaterThanOrEqual(0);
      expect(s.line).toBeLessThan(p.code.length);
      if (s.err) expect(s.type).toContain("|");
    }
    expect(p.steps.filter((s) => s.err)).toHaveLength(1);
  }
});
