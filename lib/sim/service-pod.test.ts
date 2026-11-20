import { expect, test } from "vitest";
import { awal, endpoints, kirim, matikan, perluTick, tick, type State } from "./service-pod";

const kirimN = (s: State, n: number) => { for (let i = 0; i < n; i++) s = kirim(s); return s; };

test("request dibagi rata ke Pod siap", () => {
  const s = kirimN(awal(3), 9);
  expect(s.pods.map((p) => p.hits)).toEqual([3, 3, 3]);
});

test("Pod mati langsung keluar dari endpoints dan tidak dapat request", () => {
  const m = matikan(awal(3), 2);
  expect(endpoints(m).map((p) => p.id)).toEqual([1, 3]);
  const s = kirimN(m, 4);
  expect(s.pods.find((p) => p.id === 2)!.hits).toBe(0);
  expect(s.gagal).toBe(0);
});

test("reconciliation memulihkan jumlah replicas dengan Pod baru", () => {
  let s = matikan(awal(3), 2);
  s = tick(s);
  expect(s.pods.find((p) => p.status === "mulai")!.id).toBe(4);
  expect(endpoints(s)).toHaveLength(2);
  s = tick(s);
  expect(endpoints(s)).toHaveLength(3);
  expect(perluTick(s)).toBe(false);
});
