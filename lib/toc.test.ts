import { expect, test } from "vitest";
import { headingId, toc } from "./toc";

test("toc lists the ## headings in order", () => {
  const body = "## Tujuan\n\nIsi.\n\n### Detail\n\n## Cara Kerja `app.get()`\n\n## Rangkuman\n";
  expect(toc(body)).toEqual([
    { id: "tujuan", text: "Tujuan" },
    { id: "cara-kerja-app-get", text: "Cara Kerja app.get()" },
    { id: "rangkuman", text: "Rangkuman" },
  ]);
});

test("toc skips ## lines inside code fences", () => {
  expect(toc("## A\n\n```md\n## bukan judul\n```\n\n## B")).toEqual([
    { id: "a", text: "A" },
    { id: "b", text: "B" },
  ]);
});

test("headingId is kebab-case ASCII", () => {
  expect(headingId("Apa Itu Middleware? (Bagian 2)")).toBe("apa-itu-middleware-bagian-2");
});
