import { expect, test } from "vitest";
import { BAD, GOOD, plan, total } from "./docker-layers";

const flags = (r: ReturnType<typeof plan>) => r.map((x) => x.rebuilt);

test("tanpa perubahan semua layer dari cache", () => {
  expect(total(plan(GOOD, "none"))).toBe(0);
  expect(flags(plan(BAD, "none")).some(Boolean)).toBe(false);
});

test("kode berubah: urutan baik tidak menjalankan npm ci", () => {
  const r = plan(GOOD, "src");
  expect(flags(r)).toEqual([false, false, false, false, true, true]);
  expect(total(r)).toBe(1.1);
});

test("kode berubah: urutan buruk ikut membangun ulang npm ci", () => {
  const r = plan(BAD, "src");
  expect(flags(r)).toEqual([false, false, true, true, true]);
  expect(total(r)).toBe(46.1);
});

test("package.json berubah membatalkan dari COPY package ke bawah", () => {
  const r = plan(GOOD, "pkg");
  expect(flags(r)).toEqual([false, false, true, true, true, true]);
  expect(total(r)).toBe(46.3);
});
