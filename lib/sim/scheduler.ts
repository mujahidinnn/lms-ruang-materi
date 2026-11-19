export type Proc = { name: string; burst: number };
export type Slice = { name: string; start: number; end: number };
export type Stat = { name: string; burst: number; finish: number; turnaround: number; waiting: number };

// Round robin, all processes arrive at t=0 and queue in the given order.
export function roundRobin(procs: Proc[], quantum: number): { slices: Slice[]; stats: Stat[]; avgWaiting: number } {
  const left = procs.map((p) => p.burst);
  const finish: number[] = procs.map(() => 0);
  const queue = procs.map((_, i) => i).filter((i) => left[i] > 0);
  const slices: Slice[] = [];
  let t = 0;
  while (queue.length) {
    const i = queue.shift()!;
    const run = Math.min(quantum, left[i]);
    slices.push({ name: procs[i].name, start: t, end: t + run });
    t += run;
    left[i] -= run;
    if (left[i] > 0) queue.push(i);
    else finish[i] = t;
  }
  const stats = procs.map((p, i) => ({ name: p.name, burst: p.burst, finish: finish[i], turnaround: finish[i], waiting: finish[i] - p.burst }));
  return { slices, stats, avgWaiting: stats.reduce((s, x) => s + x.waiting, 0) / (stats.length || 1) };
}
