import { expect, test } from "vitest";
import { PORTOFOLIO_STEPS } from "./portofolio";
import { cleanStudioUrl } from "./url";

test("every checklist item id is unique and well formed", () => {
  const ids = PORTOFOLIO_STEPS.flatMap((s) => s.items.map((x) => x.id));
  expect(new Set(ids).size).toBe(ids.length);
  expect(PORTOFOLIO_STEPS).toHaveLength(8);
  for (const id of ids) expect(id).toMatch(/^[a-z0-9-]{3,60}$/); // same rule as the table
  for (const s of PORTOFOLIO_STEPS) expect(s.items.length).toBeGreaterThan(0);
});

test("accepts a normal https address", () => {
  expect(cleanStudioUrl(" https://rani.github.io/portofolio ")).toBe("https://rani.github.io/portofolio");
});

test("rejects http, other schemes, logins, local and IP hosts", () => {
  for (const bad of ["http://a.com", "javascript:alert(1)", "https://user:pw@a.com", "https://localhost", "https://192.168.0.1", "https://a", "https://a.local", "https://a.com/ b", "ftp://a.com", ""]) {
    expect(cleanStudioUrl(bad), bad).toBeNull();
  }
});
