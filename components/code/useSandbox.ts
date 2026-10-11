"use client";

import { useCallback } from "react";
import type { Check, CheckResult } from "@/lib/code/check-node";
import { buildSandboxDoc, type ExerciseFiles, type SandboxKind } from "@/lib/code/sandbox-doc";

export type RunResult = { logs: string[]; results: CheckResult[]; error?: string };
export type RunInput = { kind: SandboxKind; files: ExerciseFiles; setup: string; tests: Check[]; previewEl?: HTMLIFrameElement | null };

// Runs one exercise in a sandboxed iframe (scripts only, no same-origin).
// Web exercises reuse the visible preview iframe; the rest get a hidden one
// that is removed afterwards. A run over 3 s is cut off.
export function useSandbox() {
  const run = useCallback(
    (input: RunInput) =>
      new Promise<RunResult>((resolve) => {
        const nonce = crypto.randomUUID();
        const own = !input.previewEl;
        const frame = input.previewEl ?? document.createElement("iframe");
        frame.setAttribute("sandbox", "allow-scripts");
        if (own) {
          frame.hidden = true;
          document.body.appendChild(frame);
        }
        const finish = (r: RunResult) => {
          clearTimeout(timer);
          window.removeEventListener("message", onMessage);
          if (own) frame.remove();
          resolve(r);
        };
        const onMessage = (e: MessageEvent) => {
          if (e.source !== frame.contentWindow || e.data?.nonce !== nonce) return;
          finish({ logs: e.data.logs ?? [], results: e.data.results ?? [], error: e.data.error });
        };
        const timer = setTimeout(() => {
          // Replacing the document stops a runaway loop in the old one.
          frame.srcdoc = "";
          finish({ logs: [], results: [], error: "Kode berjalan terlalu lama" });
        }, 3000);
        window.addEventListener("message", onMessage);
        frame.srcdoc = buildSandboxDoc({ ...input, nonce });
      }),
    []
  );
  return { run };
}
