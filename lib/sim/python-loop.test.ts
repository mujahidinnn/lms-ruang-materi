import { expect, test } from "vitest";
import { CAP, code, trace } from "./python-loop";

test("for range(1, 6) mencetak 1 sampai 5", () => {
  const s = trace("for");
  expect(s[s.length - 1].out).toBe("1 2 3 4 5 ");
  expect(s[s.length - 1].iter).toBe(5);
});

test("akumulator menjumlah 15", () => {
  const s = trace("sum");
  expect(s[s.length - 1].out).toBe("Total: 15");
  expect(s[s.length - 2].vars).toEqual([["i", "5"], ["total", "15"]]);
});

test("while normal berakhir dengan Mulai!", () => {
  const s = trace("while");
  expect(s[s.length - 1].out).toBe("Hitung: 3\nHitung: 2\nHitung: 1\nMulai!");
  expect(s.some((x) => x.stopped)).toBe(false);
});

test("while tanpa increment dihentikan di batas aman", () => {
  const s = trace("while", true);
  const l = s[s.length - 1];
  expect(l.stopped).toBe(true);
  expect(l.iter).toBe(CAP);
  expect(code("while", true)).toHaveLength(4);
  expect(s.every((x) => x.line < code("while", true).length)).toBe(true);
});
