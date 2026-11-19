import { expect, test } from "vitest";
import { fmt, ohm, overRating } from "./ohm";
import { DIGITS, GOLD, decode, encode, expBand, format, parse } from "./resistor";
import { PRESETS as PID, metrics, simulate } from "./pid";
import { stateAt, timeline } from "./render-pipeline";
import { PRESETS as LOOP, run } from "./event-loop";
import { fromOctal, fromSymbolic, toOctal, toSymbolic } from "./chmod";

test("ohm", () => {
  expect(ohm(9, 330).i).toBeCloseTo(0.02727, 4);
  expect(ohm(5, 100).p).toBeCloseTo(0.25);
  expect(overRating(ohm(9, 100).p)).toBe(true);
  expect(overRating(ohm(5, 1000).p)).toBe(false);
  expect(ohm(5, 0).i).toBe(0);
  expect(fmt(0.0273, "A")).toBe("27,3 mA");
});

test("resistor decode/format", () => {
  expect(format(decode(4, 7, 2))).toBe("4,7 kΩ");
  expect(format(decode(1, 0, 6))).toBe("10 MΩ");
  expect(format(decode(2, 2, -1))).toBe("2,2 Ω");
  expect(expBand(-1)).toBe(GOLD);
});

test("resistor encode/parse", () => {
  expect(encode(4700)).toEqual({ d1: 4, d2: 7, exp: 2 });
  expect(encode(4.7)).toEqual({ d1: 4, d2: 7, exp: -1 });
  expect(encode(0.47)).toEqual({ d1: 4, d2: 7, exp: -2 });
  expect(encode(5)).toEqual({ d1: 5, d2: 0, exp: -1 });
  expect(encode(1234)).toBeNull();
  expect(encode(0)).toBeNull();
  expect(parse("4k7")).toBe(4700);
  expect(parse("4,7k")).toBe(4700);
  expect(parse("2.2M")).toBe(2.2e6);
  expect(parse("100 ohm")).toBe(100);
  expect(parse("abc")).toBeNull();
  for (const o of [10, 330, 1000, 47000, 1e6]) { const e = encode(o)!; expect(decode(e.d1, e.d2, e.exp)).toBeCloseTo(o, 6); }
  expect(DIGITS).toHaveLength(10);
});

test("pid deterministic and presets behave", () => {
  const sp = 5;
  const run1 = (p: { kp: number; ki: number; kd: number }) => simulate({ ...p, setpoint: sp });
  expect(run1(PID[2])).toEqual(run1(PID[2]));
  expect(simulate({ kp: 0, ki: 0, kd: 0, setpoint: sp }).every((x) => x === 0)).toBe(true);
  const [low, osc, good] = PID.map((p) => metrics(run1(p), sp));
  expect(good.overshoot).toBeLessThan(10);
  expect(good.settle).not.toBeNull();
  expect(Math.abs(good.finalErr)).toBeLessThan(0.1);
  expect(osc.overshoot).toBeGreaterThan(30);
  expect(low.settle === null || low.settle > good.settle!).toBe(true);
});

test("render pipeline timelines", () => {
  const b = timeline("biasa");
  expect(b.bars.find((x) => x.lane === "exec")!.start).toBe(5);
  expect(b.bars.filter((x) => x.lane === "parse")).toHaveLength(2);
  const d = timeline("defer");
  expect(d.bars.find((x) => x.lane === "exec")!.start).toBe(d.parseEnd);
  expect(d.dcl).toBeLessThan(b.dcl);
  const a = timeline("async");
  expect(a.bars.find((x) => x.lane === "exec")!.start).toBe(a.bars.find((x) => x.lane === "fetch")!.end);
  expect(timeline("tanpa").paint).toBe(6);
  expect(stateAt("biasa", 3).dom).toBe("blocked");
  expect(stateAt("defer", 3).dom).toBe("active");
  expect(stateAt("tanpa", 100).paint).toBe("done");
});

test("event loop order", () => {
  const out = (i: number) => { const s = run(LOOP[i].program); return s[s.length - 1].out; };
  expect(out(0)).toEqual(["A", "C", "B"]);
  expect(out(1)).toEqual(["1", "4", "3", "2"]);
  expect(out(2)).toEqual(["sinkron", "then 1", "mikro", "then 2", "timer"]);
  const s = run(LOOP[1].program);
  expect(s[s.length - 1].stack).toEqual([]);
  const t = run([
    { t: "timeout", ms: 100, line: 0, task: { label: "a", line: 0, body: [{ t: "log", text: "lambat", line: 0 }] } },
    { t: "timeout", ms: 0, line: 1, task: { label: "b", line: 1, body: [{ t: "log", text: "cepat", line: 1 }] } },
  ]);
  expect(t[t.length - 1].out).toEqual(["cepat", "lambat"]);
});

test("chmod sync", () => {
  const b = fromOctal("754")!;
  expect(toSymbolic(b)).toBe("rwxr-xr--");
  expect(toOctal(fromSymbolic("-rwxr-xr--")!)).toBe("754");
  expect(toOctal(fromSymbolic("rw-r--r--")!)).toBe("644");
  expect(fromOctal("789")).toBeNull();
  expect(fromOctal("75")).toBeNull();
  expect(fromSymbolic("rwxrwxrwz")).toBeNull();
  expect(fromSymbolic("xrwxr-xr--")).toBeNull();
});
