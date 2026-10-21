import { expect, test } from "vitest";
import { extractJson } from "./json";

test("a fenced block with prose around it", () => {
  expect(extractJson('Berikut hasilnya:\n```json\n{"a": [1, 2]}\n```\nSemoga membantu')).toEqual({ a: [1, 2] });
});

test("a bare object", () => {
  expect(extractJson('  {"a": "x {y}"} ')).toEqual({ a: "x {y}" });
});

test("the first of two blocks wins", () => {
  expect(extractJson('```json\n{"a": 1}\n```\n```json\n{"a": 2}\n```')).toEqual({ a: 1 });
});

test("a cut answer throws", () => {
  expect(() => extractJson('```json\n{"a": [1, 2')).toThrow();
});

test("Gemini's citation markers are stripped from every string", async () => {
  const { stripCitations } = await import("./json");
  expect(stripCitations({ a: "Routing itu penting[cite: 11]. [cite_start]Lanjut [cite: 3, 4]", b: ["x [cite: 2]"], n: 1 })).toEqual({ a: "Routing itu penting. Lanjut", b: ["x"], n: 1 });
});
