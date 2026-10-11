import { expect, test } from "vitest";
import { guardLoops } from "./loop-guard";

test("loop bodies get a guard call", () => {
  expect(guardLoops("while (a(b)) { x() }")).toBe("while (a(b)) {__lp(); x() }");
  expect(guardLoops("for (let i = 0; i < f(1); i++) {}")).toBe("for (let i = 0; i < f(1); i++) {__lp();}");
  expect(guardLoops("do { y() } while (z)")).toBe("do {__lp(); y() } while (z)");
});

test("strings, comments and names that contain loop words are left alone", () => {
  const src = "const s = 'while (x) {'; // for (;;) {\nconst forEach = 1; /* do { */ `${'for (;;) {'}`";
  expect(guardLoops(src)).toBe(src);
});
