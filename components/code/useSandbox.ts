"use client";

import { useCallback } from "react";
import type { Check, CheckResult } from "@/lib/code/check-node";
import { parsePhp } from "@/lib/code/php";
import { buildPythonHostDoc, buildSandboxDoc, type ExerciseFiles, type SandboxKind } from "@/lib/code/sandbox-doc";

export type RunResult = { logs: string[]; results: CheckResult[]; error?: string };
export type RunInput = { kind: SandboxKind; files: ExerciseFiles; setup: string; tests: Check[]; previewEl?: HTMLIFrameElement | null; early?: boolean };

// Runs one exercise in a sandboxed iframe (scripts only, no same-origin).
// Web exercises reuse the visible preview iframe; the rest get a hidden one
// that is removed afterwards. Python shares one hidden frame per page
// (buildPythonHostDoc) so Pyodide loads once; a timeout drops that frame. A
// run over 3 s is cut off; Python and PHP get 60 s to load, then the same
// 3 s once they report ready.
let pyHost: { frame: HTMLIFrameElement; loaded: Promise<void> } | null = null;

export function useSandbox() {
  const run = useCallback(
    (input: RunInput) =>
      new Promise<RunResult>((resolve) => {
        const nonce = crypto.randomUUID();
        const py = input.kind === "python" && !input.previewEl;
        const fresh = py && !pyHost;
        const own = !input.previewEl && !py;
        const frame = (py ? pyHost?.frame : input.previewEl) ?? document.createElement("iframe");
        if (own || fresh) {
          frame.setAttribute("sandbox", "allow-scripts");
          frame.hidden = true;
          document.body.appendChild(frame);
        }
        if (fresh) {
          const loaded = new Promise<void>((ok) => frame.addEventListener("load", () => ok(), { once: true }));
          pyHost = { frame, loaded };
          frame.srcdoc = buildPythonHostDoc();
        }
        const host = py ? pyHost : null;
        const dropHost = () => {
          if (pyHost?.frame === frame) pyHost = null;
          frame.remove();
        };
        const finish = (r: RunResult) => {
          clearTimeout(timer);
          window.removeEventListener("message", onMessage);
          if (own) frame.remove();
          resolve(r);
        };
        const onMessage = (e: MessageEvent) => {
          if (e.source !== frame.contentWindow) return;
          if (py && e.data?.hostError) {
            dropHost();
            return finish({ logs: [], results: [], error: e.data.hostError });
          }
          if (e.data?.nonce !== nonce) return;
          if (e.data.ready) return arm(3000);
          if (e.data.php) return finish(parsePhp(e.data.php.stdout ?? "", input.tests, e.data.php.stderr ?? ""));
          finish({ logs: e.data.logs ?? [], results: e.data.results ?? [], error: e.data.error });
        };
        let timer: ReturnType<typeof setTimeout>;
        const arm = (ms: number) => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            // Replacing the document stops a runaway loop in the old one.
            if (py) dropHost();
            else frame.srcdoc = "";
            finish({ logs: [], results: [], error: "Kode berjalan terlalu lama" });
          }, ms);
        };
        arm(input.kind === "python" || input.kind === "php" ? 60_000 : 3000);
        window.addEventListener("message", onMessage);
        if (!py) frame.srcdoc = buildSandboxDoc({ ...input, nonce });
        else {
          const job = { nonce, setup: input.setup, code: input.files.code ?? "", tests: input.tests };
          // Jobs wait for the host document; its worker queues them.
          host?.loaded.then(() => frame.contentWindow?.postMessage(job, "*"));
        }
      }),
    []
  );
  return { run };
}
