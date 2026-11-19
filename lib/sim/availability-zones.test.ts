import { expect, test } from "vitest";
import { availability, downtime, percent, pick, rate, verdict } from "./availability-zones";

test("pick melewati zona mati dan gagal bila semua mati", () => {
  expect(pick(3, [true, false, true], 1)).toBe(2);
  expect(pick(2, [false, true, true], 0)).toBe(1);
  expect(pick(1, [false, true, true], 0)).toBe(-1);
});

test("zona di luar deployment diabaikan", () => {
  expect(pick(2, [false, false, true], 0)).toBe(-1);
  expect(verdict(2, [false, false, true])).toBe("mati");
});

test("verdict", () => {
  expect(verdict(1, [true, true, true])).toBe("spof");
  expect(verdict(3, [true, false, true])).toBe("aman");
  expect(verdict(3, [true, false, false])).toBe("spof");
});

test("ketersediaan paralel", () => {
  expect(availability(2)).toBeCloseTo(0.999999, 9);
  expect(percent(1)).toBe("99,9%");
  expect(percent(2)).toBe("99,9999%");
  expect(percent(3)).toBe("99,9999999%");
  expect(downtime(1)).toBe("sekitar 8,8 jam");
  expect(downtime(2)).toBe("sekitar 32 detik");
  expect(downtime(3)).toBe("kurang dari 1 detik");
  expect(rate(0, 0)).toBe("-");
  expect(rate(3, 4)).toBe("75%");
});
