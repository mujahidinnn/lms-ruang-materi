import { expect, test } from "vitest";
import { neighbors, newChapterStatus, parseSlideRef, quizDone, resolveSlideRef, totalMinutes } from "./chapters";

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
