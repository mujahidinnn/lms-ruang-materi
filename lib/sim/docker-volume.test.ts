import { expect, test } from "vitest";
import { command, recreate, records, remove, start, verdict, write } from "./docker-volume";

test("tanpa volume: data hilang saat docker rm", () => {
  let s = write(write(start("none")));
  expect(records(s)).toBe(2);
  s = recreate(remove(s));
  expect(records(s)).toBe(0);
  expect(verdict(s)).toBe("hilang");
});

test.each(["named", "bind"] as const)("%s: data bertahan", (m) => {
  let s = write(start(m));
  s = remove(s);
  expect(records(s)).toBe(0);
  s = recreate(s);
  expect(records(s)).toBe(1);
  expect(verdict(s)).toBe("aman");
});

test("tidak bisa menulis saat container mati; command memuat -v", () => {
  const s = remove(start("named"));
  expect(write(s)).toBe(s);
  expect(command("named")).toContain("-v pgdata:");
  expect(command("none")).not.toContain("-v");
});
