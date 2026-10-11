export type EnginePayload = { setup: string; code: string; tests: { name: string; check: string }[]; shim: string; web: boolean; limit: number };
export type EngineResult = { logs: string[]; results: { name: string; pass: boolean; error?: string }[]; error?: string };

// Runs one exercise inside the sandbox: in a Worker for js/express, on the
// iframe page for web. `load` runs a classic script (so top-level const/let
// stay visible to later scripts) and returns what it threw, if anything.
// Self-contained: its source is injected into the sandbox as text.
export async function sandboxEngine(p: EnginePayload, load: (src: string) => unknown): Promise<EngineResult> {
  const g = globalThis as unknown as Record<string, unknown> & { console: Record<string, unknown> };
  const logs: string[] = [];
  const fmt = (v: unknown) => {
    if (typeof v === "string") return v;
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  };
  for (const k of ["log", "info", "warn", "error"]) g.console[k] = (...a: unknown[]) => void logs.push(a.map(fmt).join(" "));
  const msg = (e: unknown) => String((e as Error | null)?.message ?? e);
  const start = Date.now();
  // Called at the top of every loop body (see loop-guard.ts).
  g.__lp = () => {
    if (Date.now() - start > p.limit) throw new Error("Kode berjalan terlalu lama");
  };

  if (p.shim) load(`Object.assign(globalThis, (${p.shim})());`);
  const err = load(p.setup) ?? load(p.code);
  if (err !== undefined) return { logs, results: [], error: msg(err) };
  // Let timers and async renders from the learner's code settle first.
  if (p.web) await new Promise((r) => setTimeout(r, 50));

  const results: EngineResult["results"] = [];
  for (const t of p.tests) {
    const e = load(`globalThis.__check = (async () => (${t.check}))();`);
    if (e !== undefined) {
      results.push({ name: t.name, pass: false, error: msg(e) });
      continue;
    }
    try {
      results.push({ name: t.name, pass: (await g.__check) === true });
    } catch (e2) {
      results.push({ name: t.name, pass: false, error: msg(e2) });
    }
  }
  return { logs, results };
}
