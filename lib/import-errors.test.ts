import { expect, test } from "vitest";
import { importErrorText } from "./import-errors";

test("maps provider errors to an action", () => {
  expect(importErrorText('ApiError: {"error":{"code":503,"status":"UNAVAILABLE"}}')).toMatch(/sibuk/);
  expect(importErrorText("openrouter 429: Rate limit exceeded")).toMatch(/Kuota/);
  expect(importErrorText("SchemaError: output tidak valid (exam_questions:too_small)")).toMatch(/tidak lengkap/);
  expect(importErrorText('ApiError: {"error":{"code":400,"status":"INVALID_ARGUMENT"}}')).toMatch(/menolak permintaan/);
  expect(importErrorText(null)).toMatch(/gagal/);
});
