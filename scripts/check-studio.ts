// Validates content/studio/<slug>.json against the admin editor's schema.
//   npx tsx scripts/check-studio.ts <slug>...
import { readFileSync } from "node:fs";
import { defInput, stepInput } from "../lib/studio/schema";

let bad = 0;
for (const slug of process.argv.slice(2)) {
  const p = JSON.parse(readFileSync(`content/studio/${slug}.json`, "utf8"));
  const errs: string[] = [];
  const d = defInput.safeParse({ ...p, slug });
  if (!d.success) errs.push(`def: ${d.error.message}`);
  const seen = new Set<string>(), steps = new Set<string>();
  p.steps.forEach((s: unknown, i: number) => {
    const r = stepInput.safeParse(s);
    if (!r.success) return errs.push(`step ${i}: ${r.error.message}`);
    if (steps.has(r.data.slug)) errs.push(`step ${i}: duplicate slug ${r.data.slug}`);
    steps.add(r.data.slug);
    for (const x of [...r.data.materials, ...r.data.checks]) {
      if (seen.has(x.id)) errs.push(`step ${i}: duplicate id ${x.id}`);
      seen.add(x.id);
    }
  });
  const mins = p.steps.reduce((a: number, s: { est_minutes?: number }) => a + (s.est_minutes ?? 0), 0);
  console.log(`${slug}: ${p.steps.length} langkah, ${mins} menit${errs.length ? "\n  " + errs.join("\n  ") : " OK"}`);
  bad += errs.length;
}
process.exit(bad ? 1 : 0);
