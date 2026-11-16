import { expect, test } from "vitest";
import { diagramCount, diagramSrc, missingDiagrams, parseDiagramRef } from "./chapters";

test("parseDiagramRef returns the name of a valid gambar: source", () => {
  expect(parseDiagramRef("gambar:utp-t568a-t568b")).toBe("utp-t568a-t568b");
});

test("parseDiagramRef refuses paths, uppercase, underscores, empty names and slide refs", () => {
  for (const bad of ["gambar:../x", "gambar:ABC", "gambar:a_b", "gambar:", "gambar:a/b", "slide:3", "gambar:-a", "gambar:a-"]) {
    expect(parseDiagramRef(bad), bad).toBeNull();
  }
});

test("diagramSrc points into /praktik", () => {
  expect(diagramSrc("x-y")).toBe("/praktik/x-y.svg");
});

test("diagramCount counts gambar: references in a body", () => {
  expect(diagramCount("![a](gambar:satu)\n\ntext\n\n![b](gambar:dua) ![c](slide:2)")).toBe(2);
  expect(diagramCount("tanpa gambar")).toBe(0);
});

test("missingDiagrams lists unique missing names in order, invalid names included", () => {
  const body = "![a](gambar:ada) ![b](gambar:hilang) ![c](gambar:hilang) ![d](gambar:../bad) ![e](gambar:Besar)";
  expect(missingDiagrams(body, (n) => n === "ada")).toEqual(["hilang", "../bad", "Besar"]);
});
