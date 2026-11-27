import type { Check } from "./check-node";
import { sandboxEngine, type EnginePayload } from "./engine";
import { expressShim } from "./express-shim";
import { guardLoops } from "./loop-guard";
import { mikrotikCode } from "./mikrotik";
import { phpScript } from "./php";
import { routerOSShim } from "./routeros";

export type ExerciseFiles = { html?: string; css?: string; js?: string; code?: string };
export type SandboxKind = "web" | "js" | "express" | "python" | "mikrotik" | "php";

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

// Python runs on Pyodide in a Worker. A run posts { ready } once its packages
// are in, so the parent's time limit counts the learner's code, not the
// download. Each run gets fresh globals and builtins are restored after it,
// so a host worker can serve many runs (buildPythonHostDoc).
const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Py = any;
const PY_LOAD = async (base: string): Promise<Py> => {
  const g = globalThis as unknown as { importScripts(u: string): void; loadPyodide(o: object): Promise<Py> };
  g.importScripts(base + "pyodide.js");
  const py = await g.loadPyodide({ indexURL: base });
  py.runPython("import builtins\n_awal = dict(builtins.__dict__)\ndef _tanpa_input(*a):\n    raise RuntimeError('input() tidak tersedia di latihan ini, pakai nilai langsung')\n_awal['input'] = _tanpa_input");
  return py;
};
const PY_RUN = async (py: Py, p: { setup: string; code: string; tests: Check[] }, ready: () => void) => {
  await py.loadPackagesFromImports(p.setup + "\n" + p.code); // sqlite3 etc. are separate packages in Pyodide
  ready();
  const logs: string[] = [];
  py.setStdout({ batched: (s: string) => logs.push(s) });
  py.setStderr({ batched: (s: string) => logs.push(s) });
  // The last traceback line, "NameError: name 'x' is not defined".
  const last = (e: unknown) => String((e as Error)?.message ?? e).trim().split("\n").filter(Boolean).pop();
  // No clear(): an empty builtins breaks the very statement restoring it.
  py.runPython("builtins.__dict__.update(_awal)\nfor _k in [k for k in builtins.__dict__ if k not in _awal]: del builtins.__dict__[_k]");
  const ns = py.globals.get("dict")();
  try {
    py.runPython(p.setup + "\n" + p.code, { globals: ns });
  } catch (e) {
    return { logs, results: [], error: last(e) };
  }
  return {
    logs,
    results: p.tests.map((t) => {
      try {
        return { name: t.name, pass: py.runPython(t.check, { globals: ns }) === true };
      } catch (e) {
        return { name: t.name, pass: false, error: last(e) };
      }
    }),
  };
};
const PY_FNS = `const PY_LOAD = ${PY_LOAD.toString()};\nconst PY_RUN = ${PY_RUN.toString()};\n`;

// One page-lifetime Python sandbox: Pyodide loads once, then each
// { nonce, setup, code, tests } posted to the iframe runs in turn and answers
// with the same messages as a one-off run. useSandbox drops the frame after a
// timeout, which also stops a runaway loop.
export function buildPythonHostDoc(): string {
  const worker = `${PY_FNS}const py = PY_LOAD(${JSON.stringify(PYODIDE)});
let queue = Promise.resolve();
onmessage = (e) => {
  const p = e.data;
  queue = queue.then(async () => {
    try {
      postMessage({ nonce: p.nonce, ...(await PY_RUN(await py, p, () => postMessage({ nonce: p.nonce, ready: true }))) });
    } catch (err) {
      postMessage({ nonce: p.nonce, logs: [], results: [], error: "Python gagal dimuat: " + (err && err.message || err) });
    }
  });
};`;
  return `<!doctype html><html><head><meta charset="utf-8"><script>
const w = new Worker(URL.createObjectURL(new Blob([${embed(worker)}], { type: "text/javascript" })));
w.onmessage = (e) => parent.postMessage(e.data, "*");
w.onerror = (e) => { e.preventDefault(); parent.postMessage({ hostError: e.message }, "*"); };
addEventListener("message", (e) => { if (e.source === parent) w.postMessage(e.data); });
</script></head><body></body></html>`;
}

// PHP runs on php-wasm (WordPress Playground build) in a classic Worker: a
// module worker does not load in the null-origin iframe. It posts raw
// stdout/stderr; useSandbox parses them with parsePhp. Builds older than the
// php2shell fix (CVE-2026-109618/109619: 8.2.35, 8.3.36, 8.4.27, 8.5.12) are refused.
const PHP_WASM = "https://esm.sh/@php-wasm/";
const PHP_WASM_VERSION = "3.1.66";
const PHP_ENGINE = `(async () => {
  // Top-level TLS code in php-wasm needs crypto.subtle, which a null origin lacks; no network is used.
  if (!crypto.subtle) Object.defineProperty(crypto, "subtle", { value: { generateKey: () => new Promise(() => {}) } });
  try {
    const { loadWebRuntime } = await import(${JSON.stringify(`${PHP_WASM}web@${PHP_WASM_VERSION}`)});
    const { PHP } = await import(${JSON.stringify(`${PHP_WASM}universal@${PHP_WASM_VERSION}`)});
    const php = new PHP(await loadWebRuntime("8.4"));
    const v = (await php.run({ code: "<?php echo PHP_VERSION;" })).text;
    const [major, minor, patch] = v.split(".").map(Number);
    const min = { 2: 35, 3: 36, 4: 27, 5: 12 }[minor];
    if (major !== 8 || min === undefined || patch < min) return postMessage({ logs: [], results: [], error: "PHP " + v + " belum aman (php2shell), latihan PHP dimatikan" });
    postMessage({ ready: true });
    try {
      const r = await php.run({ code: SCRIPT });
      postMessage({ php: { stdout: r.text, stderr: r.errors } });
    } catch (e) {
      postMessage({ php: { stdout: "", stderr: String(e && e.message || e) } });
    }
  } catch (e) {
    postMessage({ logs: [], results: [], error: "PHP gagal dimuat: " + (e && e.message || e) });
  }
})();`;

// early: run the learner's JS at DOMContentLoaded instead of load, so slow images or
// fonts cannot eat the time limit (the playground sets it).
export function buildSandboxDoc(input: { kind: SandboxKind; files: ExerciseFiles; setup: string; tests: Check[]; nonce: string; early?: boolean }): string {
  const { kind, files, setup, tests, nonce, early } = input;
  const head = '<!doctype html><html><head><meta charset="utf-8">';
  const post = `const post = (m) => parent.postMessage({ nonce: ${embed(nonce)}, ...m }, "*");`;
  if (kind === "python" || kind === "php") {
    const worker = kind === "php"
      ? `const SCRIPT = ${JSON.stringify(phpScript({ setup, code: files.code ?? "", tests }))};\n${PHP_ENGINE}`
      : `${PY_FNS}PY_LOAD(${JSON.stringify(PYODIDE)}).then((py) => PY_RUN(py, ${JSON.stringify({ setup, code: files.code ?? "", tests })}, () => postMessage({ ready: true }))).then((r) => postMessage(r), (e) => postMessage({ logs: [], results: [], error: "Python gagal dimuat: " + (e && e.message || e) }));`;
    return `${head}<script>${post}
const w = new Worker(URL.createObjectURL(new Blob([${embed(worker)}], { type: "text/javascript" })));
w.onmessage = (e) => post(e.data);
w.onerror = (e) => { e.preventDefault(); post({ logs: [], results: [], error: e.message }); };
</script></head><body></body></html>`;
  }
  const payload: EnginePayload = {
    setup: guardLoops(setup),
    // The RouterOS script is data inside mikrotikCode, so it skips guardLoops.
    code: kind === "mikrotik" ? mikrotikCode(files.code ?? "") : guardLoops((kind === "web" ? files.js : files.code) ?? ""),
    tests,
    shim: kind === "express" ? expressShim.toString() : kind === "mikrotik" ? routerOSShim.toString() : "",
    web: kind === "web",
    limit: LIMIT,
  };
  const engine = sandboxEngine.toString();
  const onPage = `(${engine})(${embed(payload)}, ${LOAD_PAGE}).then(post)`;

  if (kind === "web") {
    // The harness sits in <head> and waits for load, so broken learner
    // markup (an unclosed <textarea>, say) cannot swallow it.
    const css = (files.css ?? "").replace(/<\/style/gi, "<\\/style");
    return `${head}<style>${css}</style><script>${post} addEventListener("${early ? "DOMContentLoaded" : "load"}", () => ${onPage});</script></head><body>${files.html ?? ""}</body></html>`;
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
