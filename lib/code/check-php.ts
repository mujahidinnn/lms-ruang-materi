import { spawn } from "node:child_process";
import type { Check, CheckResult } from "./check-node.ts";
import { parsePhp, phpScript } from "./php.ts";

// Worker-side validation of drafted PHP solutions (trusted authoring input),
// same script as the browser. Learner code never reaches this.
export function runChecksPhp(input: { code: string; setup: string; tests: Check[] }): Promise<{ results: CheckResult[]; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn("php", ["-d", "display_errors=stderr"], { env: {} as NodeJS.ProcessEnv, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 3000 * (input.tests.length + 2));
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", () => resolve({ results: [], error: "php tidak ditemukan" }));
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (signal) return resolve({ results: [], error: "Kode berjalan terlalu lama" });
      const { results, error } = parsePhp(stdout, input.tests, stderr);
      resolve({ results, error });
    });
    child.stdin.on("error", () => {});
    child.stdin.end(phpScript(input));
  });
}
