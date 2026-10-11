import type { Check } from "./check-node";
import { sandboxEngine, type EnginePayload } from "./engine";
import { expressShim } from "./express-shim";
import { guardLoops } from "./loop-guard";

export type ExerciseFiles = { html?: string; css?: string; js?: string; code?: string };
export type SandboxKind = "web" | "js" | "express";

// Loop guards end a runaway loop before the parent's 3 s cut-off.
const LIMIT = 2500;

// JSON for embedding in a <script>: "<" escaped so nothing can close the
// harness early.
const embed = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");

// Classic scripts share the global lexical scope, so const/let carry over.
const LOAD_PAGE = `(src) => {
  let err;
  const on = (e) => { err = e.error ?? new Error(e.message); e.preventDefault(); };
  addEventListener("error", on);
  const s = document.createElement("script");
  s.textContent = src;
  document.head.append(s);
  s.remove();
  removeEventListener("error", on);
  return err;
}`;
const LOAD_WORKER = `(src) => {
  const u = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
  try { importScripts(u); } catch (e) { return e; } finally { URL.revokeObjectURL(u); }
}`;

export function buildSandboxDoc(input: { kind: SandboxKind; files: ExerciseFiles; setup: string; tests: Check[]; nonce: string }): string {
  const { kind, files, setup, tests, nonce } = input;
  const payload: EnginePayload = {
    setup: guardLoops(setup),
    code: guardLoops((kind === "web" ? files.js : files.code) ?? ""),
    tests,
    shim: kind === "express" ? expressShim.toString() : "",
    web: kind === "web",
    limit: LIMIT,
  };
  const engine = sandboxEngine.toString();
  const post = `const post = (m) => parent.postMessage({ nonce: ${embed(nonce)}, ...m }, "*");`;
  const onPage = `(${engine})(${embed(payload)}, ${LOAD_PAGE}).then(post)`;
  const head = '<!doctype html><html><head><meta charset="utf-8">';

  if (kind === "web") {
    // The harness sits in <head> and waits for load, so broken learner
    // markup (an unclosed <textarea>, say) cannot swallow it.
    const css = (files.css ?? "").replace(/<\/style/gi, "<\\/style");
    return `${head}<style>${css}</style><script>${post} addEventListener("load", () => ${onPage});</script></head><body>${files.html ?? ""}</body></html>`;
  }

  // js/express run in a Worker, so a runaway loop never blocks the page
  // that has to cut it off. Without workers, run here (loop guards apply).
  const worker = `(${engine})(${JSON.stringify(payload)}, ${LOAD_WORKER}).then((r) => postMessage(r));`;
  return `${head}<script>${post}
try {
  const w = new Worker(URL.createObjectURL(new Blob([${embed(worker)}], { type: "text/javascript" })));
  w.onmessage = (e) => post(e.data);
  w.onerror = (e) => { e.preventDefault(); post({ logs: [], results: [], error: e.message }); };
} catch {
  ${onPage};
}
</script></head><body></body></html>`;
}
