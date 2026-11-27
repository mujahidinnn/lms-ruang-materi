import { spawn } from "node:child_process";
import type { Check, CheckResult } from "./check-node.ts";
import { parsePhp, phpScript } from "./php.ts";

// Shell, process, network and file access off: drafts may come from an LLM.
const HARDEN = [
  "-d", "display_errors=stderr",
  "-d", "disable_functions=exec,system,passthru,shell_exec,proc_open,popen,pcntl_exec,pcntl_fork,mail,putenv,dl,curl_init,curl_exec,fsockopen,pfsockopen,stream_socket_client,stream_socket_server,socket_create,symlink,link,chmod,chown",
  "-d", "open_basedir=/nonexistent",
  "-d", "allow_url_fopen=0",
  "-d", "allow_url_include=0",
];

// Worker-side validation of drafted PHP solutions (authoring input, possibly
// LLM-written), same script as the browser. Learner code never reaches this.
// ponytail: hardened host php, not a jail; move to @php-wasm/node if drafts come from untrusted people.
export function runChecksPhp(input: { code: string; setup: string; tests: Check[] }): Promise<{ results: CheckResult[]; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn("php", HARDEN, { env: {} as NodeJS.ProcessEnv, stdio: ["pipe", "pipe", "pipe"] });
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
