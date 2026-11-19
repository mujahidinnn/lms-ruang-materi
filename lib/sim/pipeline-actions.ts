export type Job = { id: string; title: string; group: string; needs: string[]; cmd: string };
export type Outcome = "lulus" | "gagal" | "dilewati";
export type Phase = "menunggu" | "jalan" | Outcome;

export const STEPS = 3;
export const VERSIONS = ["18", "20", "22"];

export function buildJobs(matrix: boolean, needs: boolean): Job[] {
  const tes: Job[] = matrix
    ? VERSIONS.map((v) => ({ id: `tes-${v}`, title: `tes (node ${v})`, group: "tes", needs: [], cmd: "npm test" }))
    : [{ id: "tes", title: "tes", group: "tes", needs: [], cmd: "npm test" }];
  const jobs: Job[] = [{ id: "lint", title: "lint", group: "lint", needs: [], cmd: "npm run lint" }, ...tes];
  const build: Job = { id: "build", title: "build", group: "build", needs: needs ? ["lint", "tes"] : [], cmd: "npm run build" };
  const deploy: Job = { id: "deploy", title: "deploy", group: "deploy", needs: needs ? ["build"] : [], cmd: "echo deploy" };
  return [...jobs, build, deploy];
}

// "needs: tes" menunggu semua anggota grup tes (matrix) selesai.
const deps = (jobs: Job[], j: Job) => jobs.filter((x) => j.needs.includes(x.id) || j.needs.includes(x.group));

export function levels(jobs: Job[]): Record<string, number> {
  const out: Record<string, number> = {};
  const lv = (j: Job): number => (out[j.id] ??= Math.max(-1, ...deps(jobs, j).map(lv)) + 1);
  jobs.forEach(lv);
  return out;
}

export function outcomes(jobs: Job[], failId: string | null): Record<string, Outcome> {
  const lv = levels(jobs);
  const out: Record<string, Outcome> = {};
  [...jobs].sort((a, b) => (lv[a.id] as number) - (lv[b.id] as number)).forEach((j) => {
    out[j.id] = deps(jobs, j).some((d) => out[d.id] !== "lulus") ? "dilewati" : j.id === failId ? "gagal" : "lulus";
  });
  return out;
}

export const totalTicks = (jobs: Job[]) => (Math.max(...Object.values(levels(jobs))) + 1) * STEPS;

// t = jumlah tick sejak Run; t < 0 berarti belum dijalankan. step = langkah yang sudah selesai.
export function view(jobs: Job[], failId: string | null, t: number): Record<string, { phase: Phase; step: number }> {
  const lv = levels(jobs), res = outcomes(jobs, failId);
  return Object.fromEntries(jobs.map((j) => {
    const start = (lv[j.id] as number) * STEPS, o = res[j.id] as Outcome;
    if (t < 0 || t < start) return [j.id, { phase: "menunggu" as Phase, step: 0 }];
    if (o === "dilewati") return [j.id, { phase: o as Phase, step: 0 }];
    const step = Math.min(STEPS, t - start);
    return [j.id, { phase: (step >= STEPS ? o : "jalan") as Phase, step }];
  }));
}

export function yaml(jobs: Job[], matrix: boolean): { text: string; job?: string }[] {
  const rows: { text: string; job?: string }[] = [{ text: "jobs:" }];
  for (const id of [...new Set(jobs.map((j) => j.group))]) {
    const j = jobs.find((x) => x.group === id) as Job;
    rows.push({ text: `  ${id}:` });
    if (j.needs.length) rows.push({ text: `    needs: ${j.needs.length > 1 ? `[${j.needs.join(", ")}]` : j.needs[0]}`, job: id });
    if (matrix && id === "tes") rows.push({ text: `    strategy: { matrix: { node: [${VERSIONS.join(", ")}] } }` });
    rows.push({ text: "    runs-on: ubuntu-latest" });
  }
  return rows;
}
