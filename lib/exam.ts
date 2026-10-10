// What the exam intro page shows, mirrored from start_exam_attempt() (which
// is what enforces it). Pure, safe in client components.

export type AttemptRow = {
  id: string;
  deadline: string;
  submitted_at: string | null;
  score: number | null;
  passed: boolean | null;
};

export type ExamStanding = {
  passed: boolean;
  best: number | null;
  left: number; // attempts left in the current set
  openId: string | null; // attempt still running
  nextSetAt: Date | null; // when a used-up set reopens, if in the future
};

const GRACE_MS = 30_000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Past the deadline and its grace, so a submit would be refused.
export function timedOut(deadline: string, now = Date.now()): boolean {
  return new Date(deadline).getTime() + GRACE_MS < now;
}

// Seconds to the deadline by the server's clock. The runner counts down from
// this, so a phone whose clock is off still submits on time.
export function secondsLeft(deadline: string, now = Date.now()): number {
  return Math.max(0, Math.round((new Date(deadline).getTime() - now) / 1000));
}

export function standing(attempts: AttemptRow[], maxAttempts: number, now: Date): ExamStanding {
  const open = attempts.find((a) => !a.submitted_at && new Date(a.deadline).getTime() + GRACE_MS > now.getTime());
  const scores = attempts.flatMap((a) => (a.score === null ? [] : [a.score]));
  const n = attempts.length;
  const used = n % maxAttempts === 0 && n > 0 ? maxAttempts : n % maxAttempts;
  const lastEnd = Math.max(0, ...attempts.map((a) => new Date(a.submitted_at ?? a.deadline).getTime()));
  const reopen = used === maxAttempts && lastEnd + DAY_MS > now.getTime() ? new Date(lastEnd + DAY_MS) : null;

  return {
    passed: attempts.some((a) => a.passed),
    best: scores.length ? Math.max(...scores) : null,
    left: reopen ? 0 : used === maxAttempts ? maxAttempts : maxAttempts - used,
    openId: open?.id ?? null,
    nextSetAt: reopen,
  };
}
