import { spawn } from "node:child_process";
import type { Check, CheckResult } from "./check-node.ts";
import { parsePhp, phpScript } from "./php.ts";

// Shell, process, network and file access off: drafts may come from an LLM.
// -n skips the host php.ini and its extensions (FFI, posix, sockets...); only
// what the lessons use is loaded back (pdo_sqlite when installed).
const HARDEN = [
  "-n",
  "-d", "display_startup_errors=0",
  ...["mbstring", "ctype", "pdo", "pdo_sqlite"].flatMap((x) => ["-d", `extension=${x}`]),
  "-d", "display_errors=stderr",
  "-d", "ffi.enable=0",
  "-d", "enable_dl=0",
  "-d", "disable_functions=exec,system,passthru,shell_exec,proc_open,popen,proc_nice,proc_get_status,proc_terminate,pcntl_exec,pcntl_fork,pcntl_signal,pcntl_alarm,mail,mb_send_mail,imap_open,error_log,putenv,dl,curl_init,curl_exec,curl_multi_exec,fsockopen,pfsockopen,stream_socket_client,stream_socket_server,stream_socket_pair,socket_create,symlink,link,chmod,chown,set_include_path,parse_ini_file,show_source,highlight_file",
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
