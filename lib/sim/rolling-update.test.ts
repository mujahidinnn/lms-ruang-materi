import { expect, test } from "vitest";
import { awal, langkah, rollback, status, valid, type Cfg, type State } from "./rolling-update";

const jalan = (c: Cfg, s: State) => {
  const siap = [status(c, s).ready];
  for (let i = 0; i < 20 && !status(c, s).selesai && !status(c, s).macet; i++) { s = langkah(c, s); siap.push(status(c, s).ready); }
  return { s, siap };
};

test("surge 1 unavailable 0: kapasitas tidak pernah turun, semua jadi v2", () => {
  const c = { replicas: 4, maxSurge: 1, maxUnavailable: 0 };
  const { s, siap } = jalan(c, awal(4));
  expect(Math.min(...siap)).toBe(4);
  expect(status(c, s).selesai).toBe(true);
  expect(s.pods.every((p) => p.v === 2)).toBe(true);
});

test("batas pod: tidak lewat replicas+surge, tidak di bawah replicas-unavailable", () => {
  const c = { replicas: 4, maxSurge: 1, maxUnavailable: 1 };
  let s = awal(4);
  while (!status(c, s).selesai) { s = langkah(c, s); expect(status(c, s).total).toBeLessThanOrEqual(5); expect(status(c, s).ready).toBeGreaterThanOrEqual(3); }
  expect(valid({ replicas: 3, maxSurge: 0, maxUnavailable: 0 })).toBe(false);
});

test("v2 rusak macet di batas minimum, rollback memulihkan v1", () => {
  const c = { replicas: 4, maxSurge: 1, maxUnavailable: 1 };
  const { s } = jalan(c, awal(4, true));
  expect(status(c, s)).toMatchObject({ macet: true, ready: 3 });
  const r = jalan(c, rollback(s)).s;
  expect(status(c, r).selesai).toBe(true);
  expect(r.pods.every((p) => p.v === 1)).toBe(true);
});
