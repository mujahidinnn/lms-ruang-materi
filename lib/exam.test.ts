import { describe, expect, it } from "vitest";
import { standing, type AttemptRow } from "./exam";

const now = new Date("2026-10-09T12:00:00Z");
const ago = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString();
const done = (h: number, score: number, passed = false): AttemptRow => ({
  id: `a${h}`,
  deadline: ago(h),
  submitted_at: ago(h),
  score,
  passed,
});

describe("standing", () => {
  it("starts with every attempt left", () => {
    expect(standing([], 3, now)).toEqual({ passed: false, best: null, left: 3, openId: null, nextSetAt: null });
  });

  it("counts attempts in the current set and keeps the best score", () => {
    const s = standing([done(5, 40), done(3, 60)], 3, now);
    expect([s.left, s.best, s.nextSetAt]).toEqual([1, 60, null]);
  });

  it("closes a used-up set for 24 hours after the last attempt, then opens a new one", () => {
    const full = [done(10, 40), done(5, 50), done(2, 60)];
    expect(standing(full, 3, now)).toMatchObject({ left: 0, nextSetAt: new Date(new Date(ago(2)).getTime() + 86_400_000) });
    const later = [done(30, 40), done(28, 50), done(25, 60)];
    expect(standing(later, 3, now)).toMatchObject({ left: 3, nextSetAt: null });
  });

  it("finds the attempt still running", () => {
    const running: AttemptRow = { id: "r", deadline: new Date(now.getTime() + 600_000).toISOString(), submitted_at: null, score: null, passed: null };
    expect(standing([done(5, 40), running], 3, now).openId).toBe("r");
  });
});
