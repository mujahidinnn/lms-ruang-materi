import type { Check } from "./check-node";
import { expressShim } from "./express-shim";

export type ExerciseFiles = { html?: string; css?: string; js?: string; code?: string };
export type SandboxKind = "web" | "js" | "express";

// JSON for embedding in a <script>: "<" escaped so nothing can close the
// harness early.
const embed = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

// The harness captures console, runs setup + learner code with indirect eval
// (globals stay global, syntax errors are caught), then each check, and
// posts the results to the parent with the run's nonce.
function harness(code: string, setup: string, tests: Check[], nonce: string, shim: boolean) {
  return `<script>
(async () => {
  const logs = [];
  const fmt = (v) => { if (typeof v === "string") return v; try { return JSON.stringify(v); } catch { return String(v); } };
  console.log = console.info = console.warn = console.error = (...a) => logs.push(a.map(fmt).join(" "));
  const msg = (e) => String(e && e.message || e);
  const post = (m) => parent.postMessage({ nonce: ${embed(nonce)}, logs, ...m }, "*");
  ${shim ? `Object.assign(window, (${expressShim.toString()})());` : ""}
  try {
    (0, eval)(${embed(setup)});
    (0, eval)(${embed(code)});
  } catch (e) {
    return post({ results: [], error: msg(e) });
  }
  const results = [];
  for (const t of ${embed(tests)}) {
    try {
      const v = await (0, eval)("(async () => (" + t.check + "))()");
      results.push({ name: t.name, pass: v === true });
    } catch (e) {
      results.push({ name: t.name, pass: false, error: msg(e) });
    }
  }
  post({ results });
})();
</script>`;
}

export function buildSandboxDoc(input: { kind: SandboxKind; files: ExerciseFiles; setup: string; tests: Check[]; nonce: string }): string {
  const { kind, files, setup, tests, nonce } = input;
  const head = '<!doctype html><html><head><meta charset="utf-8">';
  if (kind === "web") {
    // The learner's own page: their HTML goes in as-is, inside the sandbox.
    const css = (files.css ?? "").replace(/<\/style/gi, "<\\/style");
    return `${head}<style>${css}</style></head><body>${files.html ?? ""}${harness(files.js ?? "", setup, tests, nonce, false)}</body></html>`;
  }
  return `${head}</head><body>${harness(files.code ?? "", setup, tests, nonce, kind === "express")}</body></html>`;
}
