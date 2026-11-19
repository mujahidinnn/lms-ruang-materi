import { expect, test } from "vitest";
import { PRESETS, clampNilai, code, gradeOf, trace } from "./python-percabangan";

test("urutan benar: 78 berhenti di B dan sisanya dilewati", () => {
  const s = trace(PRESETS[0], 78);
  const last = s[s.length - 1];
  expect(last.grade).toBe("B");
  expect(last.done).toBe(true);
  expect(last.marks).toEqual(["false", "true", "skip"]);
  expect(last.elseMark).toBe("skip");
});

test("nilai rendah jatuh ke else", () => {
  const s = trace(PRESETS[0], 40);
  expect(s[s.length - 1].grade).toBe("D");
  expect(s[s.length - 1].marks).toEqual(["false", "false", "false"]);
});

test("urutan terbalik memberi C untuk 100", () => {
  expect(gradeOf(PRESETS[1], 100)).toBe("C");
  expect(gradeOf(PRESETS[0], 100)).toBe("A");
  expect(trace(PRESETS[1], 100).length).toBe(4);
});

test("baris kode dan clamp", () => {
  const c = code(PRESETS[0], 78);
  expect(c[2]).toBe("if nilai >= 85:");
  expect(c[9]).toBe('    grade = "D"');
  expect(trace(PRESETS[0], 78).every((x) => x.line < c.length)).toBe(true);
  expect(clampNilai(150)).toBe(100);
  expect(clampNilai(NaN)).toBe(0);
});
