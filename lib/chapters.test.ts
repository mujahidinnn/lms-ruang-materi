import { expect, test } from "vitest";
import { diagramCount, diagramSrc, missingDiagrams, neighbors, newChapterStatus, parseDiagramRef, parseSlideRef, quizDone, resolveSlideRef, totalMinutes } from "./chapters";

const slides = [1, 2, 3].map((index) => ({ index, src: `https://x/s/slide-0${index}.avif`, width: 3200, height: 1800 }));

test("parseSlideRef reads slide:N only", () => {
  expect(parseSlideRef("slide:12")).toBe(12);
  expect(parseSlideRef("slide:0")).toBeNull();
  expect(parseSlideRef("slide:abc")).toBeNull();
  expect(parseSlideRef("https://x/y.png")).toBeNull();
});

test("resolveSlideRef finds the slide or nothing", () => {
  expect(resolveSlideRef("slide:2", slides)?.index).toBe(2);
  expect(resolveSlideRef("slide:99", slides)).toBeNull();
});

test("quizDone needs every answer right", () => {
  const qs = [{ id: "a", answer: 1 }, { id: "b", answer: 0 }];
  expect(quizDone(qs, { a: 1, b: 0 })).toBe(true);
  expect(quizDone(qs, { a: 1 })).toBe(false);
  expect(quizDone(qs, { a: 1, b: 1 })).toBe(false);
  expect(quizDone([], {})).toBe(false);
});

test("neighbors and totalMinutes", () => {
  const list = [{ slug: "a", estMinutes: 5 }, { slug: "b", estMinutes: 7 }, { slug: "c", estMinutes: 3 }];
  expect(neighbors(list, "b")).toEqual({ prev: list[0], next: list[2] });
  expect(neighbors(list, "a").prev).toBeNull();
  expect(neighbors(list, "c").next).toBeNull();
  expect(totalMinutes(list)).toBe(15);
});

test("a new chapter is a draft unless it joins live chapters", () => {
  expect(newChapterStatus([])).toBe("draft");
  expect(newChapterStatus([{ status: "draft" }, { status: "published" }])).toBe("draft");
  expect(newChapterStatus([{ status: "published" }])).toBe("published");
});

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
