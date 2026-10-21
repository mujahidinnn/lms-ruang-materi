import { spawn } from "node:child_process";
import type { Check, CheckResult } from "./check-node.ts";

type Outcome = { results: CheckResult[]; error?: string };

// Same contract as the browser: run setup + code, then each check as a
// Python expression that must be exactly True. Errors read like the last
// traceback line.
const CHILD = `
import builtins, contextlib, io, json, sys
d = json.load(sys.stdin)
def _tanpa_input(*a):
    raise RuntimeError("input() tidak tersedia di latihan ini, pakai nilai langsung")
builtins.input = _tanpa_input
ns, out = {}, {"results": []}
msg = lambda e: f"{type(e).__name__}: {e}"
with contextlib.redirect_stdout(io.StringIO()):
    try:
        exec(d["setup"] + "\\n" + d["code"], ns)
        for t in d["tests"]:
            try:
                out["results"].append({"name": t["name"], "pass": eval(t["check"], ns) is True})
            except Exception as e:
                out["results"].append({"name": t["name"], "pass": False, "error": msg(e)})
    except Exception as e:
        out["error"] = msg(e)
sys.stdout.write(json.dumps(out))
`;

// Worker-side validation of drafted Python solutions (trusted authoring
// input). Learner code never reaches this; it runs only in the browser.
export function runChecksPython(input: { code: string; setup: string; tests: Check[] }): Promise<Outcome> {
  return new Promise((resolve) => {
    const child = spawn("python3", ["-I", "-c", CHILD], { env: {} as NodeJS.ProcessEnv, stdio: ["pipe", "pipe", "ignore"] });
    let stdout = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 3000 * (input.tests.length + 2));
    child.stdout.on("data", (d) => (stdout += d));
    child.on("error", () => resolve({ results: [], error: "python3 tidak ditemukan" }));
    child.on("close", () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(stdout) as Outcome);
      } catch {
        resolve({ results: [], error: "Kode berjalan terlalu lama" });
      }
    });
    child.stdin.on("error", () => {});
    child.stdin.end(JSON.stringify(input));
  });
}
