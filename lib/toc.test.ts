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

test("sections split the body at ## headings, outside code fences", async () => {
  const { sections } = await import("./toc");
  const body = "Pembuka.\n\n## Tujuan\n\n- a\n\n## Isi `kode`\n\n```md\n## bukan\n```\n\n### Sub\n\nx\n\n## Rangkuman\n\n- b";
  const out = sections(body);
  expect(out.map((s) => [s.id, s.title])).toEqual([["", ""], ["tujuan", "Tujuan"], ["isi-kode", "Isi kode"], ["rangkuman", "Rangkuman"]]);
  expect(out[0].body.trim()).toBe("Pembuka.");
  expect(out[2].body).toContain("## bukan");
  expect(out[2].body).toContain("### Sub");
});
