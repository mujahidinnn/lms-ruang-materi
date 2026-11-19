import { expect, test } from "vitest";
import { activeBreakpoint, classText, resolve } from "./responsive";

test("mobile-first: min-width, aturan terakhir yang aktif menang", () => {
  expect(resolve("mobile-first", 375).winner.cols).toBe(1);
  expect(resolve("mobile-first", 640).winner.cols).toBe(2);
  expect(resolve("mobile-first", 900).winner.cols).toBe(2);
  expect(resolve("mobile-first", 1024).winner.cols).toBe(4);
});
test("desktop-first: max-width", () => {
  expect(resolve("desktop-first", 1400).winner.cols).toBe(4);
  expect(resolve("desktop-first", 1023).winner.cols).toBe(2);
  expect(resolve("desktop-first", 500).winner.cols).toBe(1);
});
test("teks class dan breakpoint", () => {
  expect(classText("mobile-first")).toBe("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4");
  expect(activeBreakpoint(700)).toBe("sm");
  expect(activeBreakpoint(300)).toBe("dasar");
});
