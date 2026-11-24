"use client";

import { Play, RotateCcw } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { EditorLanguage } from "@/components/code/CodeEditor";
import { useSandbox, type RunResult } from "@/components/code/useSandbox";
import { card, primaryButton, secondaryButton } from "@/components/ui/styles";
import type { ExerciseFiles, SandboxKind } from "@/lib/code/sandbox-doc";

const CodeEditor = lazy(() => import("@/components/code/CodeEditor"));
const skeleton = <div className="h-64 animate-pulse rounded-[18px] bg-zinc-950" />;

type Mode = Extract<SandboxKind, "web" | "js" | "python">;
type Part = keyof ExerciseFiles;
const MODES: { id: Mode; label: string; parts: Part[]; start: ExerciseFiles }[] = [
  { id: "web", label: "Web", parts: ["html", "css", "js"], start: { html: "<h1>Halo, Ruang Materi!</h1>\n<button id=\"tombol\">Klik aku</button>", css: "body { font-family: system-ui; padding: 1rem; }\nbutton { padding: .5rem 1rem; }", js: "document.getElementById(\"tombol\").onclick = () => {\n  document.querySelector(\"h1\").textContent = \"Kamu mengklik!\";\n};" } },
  { id: "js", label: "JavaScript", parts: ["code"], start: { code: "const angka = [1, 2, 3, 4, 5];\nconsole.log(angka.map((n) => n * 2));" } },
  { id: "python", label: "Python", parts: ["code"], start: { code: "for i in range(1, 6):\n    print(i, \"kuadrat =\", i * i)" } },
];
const LANG: Record<Part, EditorLanguage> = { html: "html", css: "css", js: "javascript", code: "javascript" };
const LABEL: Record<Part, string> = { html: "HTML", css: "CSS", js: "JS", code: "Kode" };
const key = (m: Mode) => `ruang-materi:playground:${m}`;

function read(m: Mode, fallback: ExerciseFiles): ExerciseFiles {
  try {
    const saved = localStorage.getItem(key(m));
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

// A free editor with no exercise attached. Drafts stay in this browser.
export default function Playground() {
  const [mode, setMode] = useState<Mode>("web");
  const cfg = MODES.find((m) => m.id === mode)!;
  const [files, setFiles] = useState<ExerciseFiles>(cfg.start);
  const [part, setPart] = useState<Part>(cfg.parts[0]);
  const [version, setVersion] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [out, setOut] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = useRef<HTMLIFrameElement>(null);
  const { run } = useSandbox();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only editor and localStorage draft
  useEffect(() => { setFiles(read("web", MODES[0].start)); setMounted(true); }, []);

  function switchTo(next: Mode) {
    const c = MODES.find((m) => m.id === next)!;
    setMode(next);
    setPart(c.parts[0]);
    setFiles(read(next, c.start));
    setVersion((v) => v + 1);
    setOut(null);
  }

  function edit(p: Part, v: string) {
    const next = { ...files, [p]: v };
    setFiles(next);
    try { localStorage.setItem(key(mode), JSON.stringify(next)); } catch {}
  }

  async function go() {
    setBusy(true);
    if (mode === "python") setOut({ logs: ["Menyiapkan Python (sekali per kunjungan, beberapa detik)..."], results: [] });
    setOut(await run({ kind: mode, files, setup: "", tests: [], previewEl: mode === "web" ? preview.current : null }));
    setBusy(false);
  }

  function reset() {
    try { localStorage.removeItem(key(mode)); } catch {}
    setFiles(cfg.start);
    setVersion((v) => v + 1);
    setOut(null);
  }

  return (
    <section aria-label="Playground kode" className={`p-5 sm:p-7 ${card}`}>
      <div role="tablist" aria-label="Bahasa" className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button key={m.id} type="button" role="tab" aria-selected={mode === m.id} onClick={() => switchTo(m.id)} className={`min-h-11 rounded-full px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent ${mode === m.id ? "bg-primary text-on-primary" : "bg-zinc-800 text-zinc-300"}`}>{m.label}</button>
        ))}
      </div>
      {cfg.parts.length > 1 && (
        <div role="tablist" aria-label="Berkas" className="mt-3 flex gap-2">
          {cfg.parts.map((p) => (
            <button key={p} type="button" role="tab" aria-selected={part === p} onClick={() => setPart(p)} className={`min-h-10 rounded-full px-4 text-sm font-medium ${part === p ? "bg-noir text-on-noir" : "bg-zinc-800 text-zinc-300"}`}>{LABEL[p]}</button>
          ))}
        </div>
      )}
      <div className="mt-3">
        {mounted ? (
          <Suspense fallback={skeleton}>
            <CodeEditor key={`${mode}-${part}-${version}`} value={files[part] ?? ""} onChange={(v) => edit(part, v)} language={mode === "python" ? "python" : LANG[part]} label={`Editor ${LABEL[part]}`} />
          </Suspense>
        ) : skeleton}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={go} disabled={busy} className={primaryButton}><Play aria-hidden className="size-4" />Jalankan</button>
        <button type="button" onClick={reset} className={secondaryButton}><RotateCcw aria-hidden className="size-4" />Reset</button>
      </div>
      {mode === "web" && <iframe ref={preview} title="Hasil" sandbox="allow-scripts" className="mt-4 h-72 w-full rounded-[18px] border-0 bg-white" />}
      <div aria-live="polite" className="mt-4 space-y-3 empty:hidden">
        {out?.error && <p className="rounded-xl bg-tile-pink px-4 py-3 text-sm"><span className="font-semibold">Error:</span> {out.error}</p>}
        {out && out.logs.length > 0 && <pre className="scrollbar-thin max-h-56 overflow-auto rounded-[18px] bg-zinc-950 p-4 text-sm"><code className="font-mono">{out.logs.join("\n")}</code></pre>}
      </div>
    </section>
  );
}
