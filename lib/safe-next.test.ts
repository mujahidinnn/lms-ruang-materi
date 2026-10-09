import { expect, test } from "vitest";
import { safeNext } from "./safe-next";

test("keeps relative paths", () => {
  expect(safeNext("/admin")).toBe("/admin");
  expect(safeNext("/belajar/git?x=1")).toBe("/belajar/git?x=1");
});

test("rejects off-site and junk", () => {
  for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "admin", "", null, undefined, ["/a"]]) {
    expect(safeNext(bad)).toBe("/");
  }
});
