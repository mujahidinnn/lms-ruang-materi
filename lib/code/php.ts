import type { Check, CheckResult } from "./check-node.ts";

type Outcome = { logs: string[]; results: CheckResult[]; error?: string };

// The marker between the learner's output and the harness's JSON verdict.
const MARK = "__ruang_materi_hasil_7f3a__";
const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));

// One PHP script for both runners (php-wasm in the browser, php CLI for
// authoring checks). eval is the point: learner code only ever runs inside
// the sandboxed php-wasm worker, the CLI sees trusted authoring input only.
// Setup + code run through eval at the top level, so
// their functions and variables are global, then each check is a PHP
// expression that must be exactly true. Warnings print as log lines. The
// leading <?php tag is stripped and the rest evaluated raw, so
// declare(strict_types=1) can stay the first statement.
export function phpScript(input: { setup: string; code: string; tests: Check[] }): string {
  const src = (s: string) => `base64_decode('${b64(s)}')`;
  return `<?php
ini_set('display_errors', 'stderr');
set_error_handler(function ($no, $msg, $file, $line) { echo "Peringatan: $msg (baris $line)\\n"; return true; });
$__rm_tag = fn ($s) => preg_replace('/^\\s*<\\?php\\b/', '', $s, 1);
$__rm_err = fn ($e) => (new \\ReflectionClass($e))->getShortName() . ': ' . $e->getMessage();
try {
  eval($__rm_tag(${src(input.setup)}));
  eval($__rm_tag(${src(input.code)}));
} catch (\\Throwable $__rm_e) {
  echo '${MARK}' . json_encode(['error' => $__rm_err($__rm_e)]);
  return;
}
$__rm_out = [];
foreach (json_decode(${src(JSON.stringify(input.tests.map((t) => t.check)))}) as $__rm_c) {
  try { $__rm_out[] = ['pass' => eval('return ' . $__rm_c . ';') === true]; }
  catch (\\Throwable $__rm_e) { $__rm_out[] = ['pass' => false, 'error' => $__rm_err($__rm_e)]; }
}
echo '${MARK}' . json_encode(['results' => $__rm_out]);
`;
}

// Splits the script's stdout into the learner's log lines and the verdict.
// No marker means PHP stopped early (exit, die or a fatal error).
export function parsePhp(stdout: string, tests: Check[], stderr = ""): Outcome {
  const at = stdout.lastIndexOf(MARK);
  const logs = (at < 0 ? stdout : stdout.slice(0, at)).split("\n").filter((l) => l.trim());
  if (at < 0) {
    const fatal = stderr.split("\n").find((l) => /Fatal error/.test(l))?.replace(/^PHP\s+/, "").trim();
    return { logs, results: [], error: fatal ?? "Kode berhenti (exit/die) sebelum diperiksa" };
  }
  const v = JSON.parse(stdout.slice(at + MARK.length)) as { error?: string; results?: { pass: boolean; error?: string }[] };
  if (v.error) return { logs, results: [], error: v.error };
  return { logs, results: (v.results ?? []).map((r, i) => ({ name: tests[i].name, ...r })) };
}
