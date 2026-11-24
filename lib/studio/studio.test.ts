import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";
import { stepInput } from "./schema";
import { STAGES } from "./stages";
import { cleanStudioUrl } from "./url";

test("the portfolio project parses against the step schema, with unique ids", async () => {
  const p = JSON.parse(await readFile(new URL("../../content/studio/portofolio.json", import.meta.url), "utf8"));
  const steps = p.steps.map((s: unknown) => stepInput.parse(s));
  expect(steps.length).toBeGreaterThan(0);
  const slugs = steps.map((s: { slug: string }) => s.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  const ids = steps.flatMap((s: { checks: { id: string }[]; materials: { id: string }[] }) => [...s.checks.map((c) => c.id), ...s.materials.map((m) => m.id)]);
  expect(new Set(ids).size).toBe(ids.length);
  // Every stage is covered, so the Studio's eight stages all have content.
  for (const stage of STAGES) expect(steps.some((s: { stage: string }) => s.stage === stage.id), stage.id).toBe(true);
});

test("rejects a step with a bad link, stage or empty check", () => {
  const ok = { stage: "brief", slug: "langkah-satu", title: "Langkah satu", body: "x", materials: [], checks: [] };
  expect(stepInput.safeParse(ok).success).toBe(true);
  expect(stepInput.safeParse({ ...ok, stage: "lain" }).success).toBe(false);
  expect(stepInput.safeParse({ ...ok, materials: [{ id: "m-satu", kind: "tautan", name: "x", url: "javascript:alert(1)" }] }).success).toBe(false);
  expect(stepInput.safeParse({ ...ok, materials: [{ id: "m-satu", kind: "tautan", name: "x", url: "/belajar/git" }] }).success).toBe(true);
  expect(stepInput.safeParse({ ...ok, checks: [{ id: "c-satu", text: " " }] }).success).toBe(false);
});

test("accepts a normal https address", () => {
  expect(cleanStudioUrl(" https://rani.github.io/portofolio ")).toBe("https://rani.github.io/portofolio");
});

test("rejects http, other schemes, logins, local and IP hosts", () => {
  for (const bad of ["http://a.com", "javascript:alert(1)", "https://user:pw@a.com", "https://localhost", "https://192.168.0.1", "https://a", "https://a.local", "https://a.com/ b", "ftp://a.com", ""]) {
    expect(cleanStudioUrl(bad), bad).toBeNull();
  }
});
