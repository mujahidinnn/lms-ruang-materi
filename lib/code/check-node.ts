import vm from "node:vm";
import { expressShim } from "./express-shim";

export type Check = { name: string; check: string };
export type CheckResult = { name: string; pass: boolean; error?: string };

const TOO_LONG = "Kode berjalan terlalu lama";
const message = (e: unknown) => (e instanceof Error || (e && typeof e === "object" && "message" in e) ? String((e as Error).message) : String(e));

// Worker-side validation of drafted solutions (js, express). Learner code
// never reaches this; it runs only in the browser sandbox.
export async function runChecksNode(input: { kind: "js" | "express"; code: string; setup: string; tests: Check[] }): Promise<{ results: CheckResult[]; error?: string }> {
  const quiet = { log() {}, info() {}, warn() {}, error() {} };
  const ctx = vm.createContext({ console: quiet, ...(input.kind === "express" ? expressShim() : {}) });
  try {
    vm.runInContext(`${input.setup}\n${input.code}`, ctx, { timeout: 3000 });
  } catch (e) {
    const msg = message(e);
    return { results: [], error: /timed out/i.test(msg) ? TOO_LONG : msg };
  }
  const results: CheckResult[] = [];
  for (const t of input.tests) {
    let timer: NodeJS.Timeout | undefined;
    try {
      const run = vm.runInContext(`(async () => (${t.check}))()`, ctx, { timeout: 3000 }) as Promise<unknown>;
      const late = new Promise((_, no) => (timer = setTimeout(() => no(new Error(TOO_LONG)), 3000)));
      results.push({ name: t.name, pass: (await Promise.race([run, late])) === true });
    } catch (e) {
      results.push({ name: t.name, pass: false, error: message(e) });
    } finally {
      clearTimeout(timer);
    }
  }
  return { results };
}
