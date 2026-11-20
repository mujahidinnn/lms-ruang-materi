import { expect, test } from "vitest";
import { awal, langkah, ubahOperand, type Cpu } from "./cpu-fetch-execute";

const jalan = (s: Cpu) => { let c = 0; while (!s.selesai && c++ < 50) s = langkah(s); return s; };

test("fetch mengisi IR dan menaikkan PC", () => {
  const s = langkah(awal());
  expect(s.ir).toEqual({ op: "LOAD", arg: 5 });
  expect([s.pc, s.baca, s.fase]).toEqual([1, 0, "decode"]);
});

test("program 5 + 3 + 3 menyimpan 11 di alamat 7 dalam 15 langkah", () => {
  const s = jalan(awal());
  expect([s.acc, s.mem[7], s.langkah, s.selesai]).toEqual([11, 11, 15, true]);
});

test("mengubah operand mengubah hasil", () => {
  expect(jalan(ubahOperand(awal(), 6, 10)).mem[7]).toBe(25);
});
