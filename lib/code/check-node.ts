import { spawn } from "node:child_process";
import { expressShim } from "./express-shim.ts";

export type Check = { name: string; check: string };
export type CheckResult = { name: string; pass: boolean; error?: string };
type Outcome = { results: CheckResult[]; error?: string };

const TOO_LONG = "Kode berjalan terlalu lama";

// Runs inside the child. The context gets no host objects and no code
// generation from strings, which closes the usual constructor.constructor
// escape to `process`; the process itself has no env and, under the Node
// permission model, no fs, child processes or workers.
const CHILD = (shim: string) => `
const vm = require("node:vm");
let raw = "";
process.stdin.on("data", (d) => (raw += d)).on("end", async () => {
  const { kind, code, setup, tests } = JSON.parse(raw);
  const msg = (e) => String((e && e.message) || e);
  const ctx = vm.createContext({}, { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext("globalThis.console = { log() {}, info() {}, warn() {}, error() {} };" +
    (kind === "express" ? "Object.assign(globalThis, (" + ${JSON.stringify(shim)} + ")());" : ""), ctx);
  const out = { results: [] };
  try {
    vm.runInContext(setup + "\\n" + code, ctx, { timeout: 3000 });
    for (const t of tests) {
      try {
        const v = await vm.runInContext("(async () => (" + t.check + "))()", ctx, { timeout: 3000 });
        out.results.push({ name: t.name, pass: v === true });
      } catch (e) {
        out.results.push({ name: t.name, pass: false, error: msg(e) });
      }
    }
  } catch (e) {
    out.error = /timed out/i.test(msg(e)) ? ${JSON.stringify(TOO_LONG)} : msg(e);
  }
  process.stdout.write(JSON.stringify(out));
});`;

// Worker-side validation of drafted solutions (js, express). Learner code
// never reaches this; it runs only in the browser sandbox.
export function runChecksNode(input: { kind: "js" | "express"; code: string; setup: string; tests: Check[] }): Promise<Outcome> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--permission", "--disallow-code-generation-from-strings", "-e", CHILD(expressShim.toString())], { env: {} as NodeJS.ProcessEnv, stdio: ["pipe", "pipe", "ignore"] });
    let stdout = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 3000 * (input.tests.length + 2));
    child.stdout.on("data", (d) => (stdout += d));
    child.on("close", () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(stdout) as Outcome);
      } catch {
        resolve({ results: [], error: TOO_LONG });
      }
    });
    child.stdin.end(JSON.stringify(input));
  });
}
