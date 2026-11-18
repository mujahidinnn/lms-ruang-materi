import { expect, test } from "vitest";
import { pick } from "./load-balancer";
import { matches } from "./mqtt";

test("round robin skips down servers", () => {
  const s = [{ up: true, active: 0 }, { up: false, active: 0 }, { up: true, active: 0 }];
  expect([0, 1, 2, 3].map((n) => pick("round-robin", s, n))).toEqual([0, 2, 2, 0]);
  expect(pick("round-robin", s.map((x) => ({ ...x, up: false })), 0)).toBe(-1);
});

test("least connections takes the idlest up server", () => {
  expect(pick("least-connections", [{ up: true, active: 3 }, { up: true, active: 1 }, { up: false, active: 0 }], 0)).toBe(1);
});

test("mqtt wildcards", () => {
  expect(matches("rumah/+/suhu", "rumah/dapur/suhu")).toBe(true);
  expect(matches("rumah/+", "rumah/dapur/suhu")).toBe(false);
  expect(matches("rumah/#", "rumah/dapur/suhu")).toBe(true);
  expect(matches("rumah/dapur/suhu", "rumah/dapur")).toBe(false);
});
