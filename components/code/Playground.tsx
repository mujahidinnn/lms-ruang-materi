"use client";

import { Globe, Play, RotateCcw } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { EditorLanguage } from "@/components/code/CodeEditor";
import { useSandbox, type RunResult } from "@/components/code/useSandbox";
import { primaryButton, secondaryButton } from "@/components/ui/styles";
import { splitDocument } from "@/lib/code/playground";
import type { ExerciseFiles, SandboxKind } from "@/lib/code/sandbox-doc";

const CodeEditor = lazy(() => import("@/components/code/CodeEditor"));
const skeleton = <div className="size-full animate-pulse bg-zinc-950" />;

type Mode = Extract<SandboxKind, "web" | "js" | "python">;
type Part = keyof ExerciseFiles;
type Example = { label: string; files: ExerciseFiles };
const MODES: { id: Mode; label: string; parts: Part[]; file: string; examples: Example[] }[] = [
  {
    id: "web", label: "Web", parts: ["html"], file: "index.html",
    examples: [
      { label: "Tombol interaktif", files: { html: "<!DOCTYPE html>\n<html lang=\"id\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Tombol interaktif</title>\n  <style>\n    body { font-family: system-ui; padding: 1rem; }\n    button { padding: .5rem 1rem; }\n  </style>\n</head>\n<body>\n  <h1>Halo, Ruang Materi!</h1>\n  <button id=\"tombol\">Klik aku</button>\n\n  <script>\n    document.getElementById(\"tombol\").onclick = () => {\n      document.querySelector(\"h1\").textContent = \"Kamu mengklik!\";\n    };\n  </script>\n</body>\n</html>" } },
      { label: "Kartu profil", files: { html: "<!DOCTYPE html>\n<html lang=\"id\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Kartu profil</title>\n  <style>\n    body { display: grid; place-items: center; min-height: 100vh; margin: 0; background: #f2f3ed; font-family: system-ui; }\n    .kartu { background: white; padding: 2rem; border-radius: 1.25rem; text-align: center; box-shadow: 0 8px 24px #0002; }\n    .avatar { width: 4rem; height: 4rem; margin: 0 auto 1rem; display: grid; place-items: center; border-radius: 50%; background: #b7d97a; font-size: 1.5rem; font-weight: 700; }\n  </style>\n</head>\n<body>\n  <article class=\"kartu\">\n    <div class=\"avatar\">R</div>\n    <h2>Rani</h2>\n    <p>Belajar web dari nol</p>\n  </article>\n</body>\n</html>" } },
      { label: "Hitung klik", files: { html: "<!DOCTYPE html>\n<html lang=\"id\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Hitung klik</title>\n  <style>\n    body { font-family: system-ui; padding: 1rem; }\n    b { font-size: 2rem; }\n  </style>\n</head>\n<body>\n  <p>Jumlah klik: <b id=\"n\">0</b></p>\n  <button id=\"tambah\">Tambah</button>\n\n  <script>\n    let n = 0;\n    document.getElementById(\"tambah\").onclick = () => {\n      document.getElementById(\"n\").textContent = ++n;\n    };\n  </script>\n</body>\n</html>" } },
    ],
  },
  {
    id: "js", label: "JavaScript", parts: ["code"], file: "kode.js",
    examples: [
      { label: "Array dan map", files: { code: "const angka = [1, 2, 3, 4, 5];\nconsole.log(angka.map((n) => n * 2));" } },
      { label: "Fungsi", files: { code: "function sapa(nama) {\n  return `Halo, ${nama}!`;\n}\nconsole.log(sapa(\"Ruang Materi\"));" } },
      { label: "Objek", files: { code: "const murid = { nama: \"Rani\", kelas: [\"HTML\", \"Git\"] };\nfor (const k of murid.kelas) console.log(`${murid.nama} belajar ${k}`);" } },
    ],
  },
  {
    id: "python", label: "Python", parts: ["code"], file: "main.py",
    examples: [
      { label: "Perulangan", files: { code: "for i in range(1, 6):\n    print(i, \"kuadrat =\", i * i)" } },
      { label: "Fungsi", files: { code: "def sapa(nama):\n    return f\"Halo, {nama}!\"\n\nprint(sapa(\"Ruang Materi\"))" } },
      { label: "Dictionary", files: { code: "nilai = {\"Rani\": 90, \"Budi\": 85}\nfor nama, n in nilai.items():\n    print(nama, \"mendapat\", n)" } },
    ],
  },
];
const LANG: Record<Part, EditorLanguage> = { html: "html", css: "css", js: "javascript", code: "javascript" };
const LABEL: Record<Part, string> = { html: "index.html", css: "style.css", js: "script.js", code: "kode" };
// "web-html": the web draft used to be three files (html, css, js); a new key keeps old drafts from loading.
const key = (m: Mode) => `ruang-materi:playground:${m === "web" ? "web-html" : m}`;
const mod = (id: Mode) => MODES.find((m) => m.id === id)!;

function read(m: Mode): ExerciseFiles {
  try {
    const saved = localStorage.getItem(key(m));
    return saved ? JSON.parse(saved) : mod(m).examples[0].files;
  } catch {
    return mod(m).examples[0].files;
  }
}

const panel = "overflow-hidden rounded-[18px] border-2 border-noir bg-zinc-900";
const bar = "flex min-h-12 flex-wrap items-center gap-2 border-b-2 border-noir bg-zinc-800 px-3 py-1.5";
const body = "h-[22rem] lg:h-[34rem]";

// A free editor with no exercise attached. Drafts stay in this browser.
// Web results update while typing; JavaScript and Python run on demand.
export default function Playground() {
  const [mode, setMode] = useState<Mode>("web");
  const cfg = mod(mode);
  const [files, setFiles] = useState<ExerciseFiles>(cfg.examples[0].files);
  const [part, setPart] = useState<Part>(cfg.parts[0]);
  const [version, setVersion] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [out, setOut] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [tabTitle, setTabTitle] = useState("");
  const preview = useRef<HTMLIFrameElement>(null);
  const { run } = useSandbox();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only editor and localStorage draft
  useEffect(() => { setFiles(read("web")); setMounted(true); }, []);

  const go = useCallback(async () => {
    setBusy(true);
    if (mode === "python") setOut({ logs: ["Menyiapkan Python (sekali per kunjungan, beberapa detik)..."], results: [] });
    if (mode === "web") {
      const { files: parts, notes: n, title } = splitDocument(files.html ?? "");
      setNotes(n);
      setTabTitle(title);
      setOut(await run({ kind: "web", files: parts, setup: "", tests: [], previewEl: preview.current, early: true }));
    } else {
      setNotes([]);
      setOut(await run({ kind: mode, files, setup: "", tests: [] }));
    }
    setBusy(false);
  }, [mode, files, run]);

  // Web: show the page as soon as the editor is ready and after every pause in typing.
  useEffect(() => {
    if (mode !== "web" || !mounted) return;
    const t = setTimeout(go, 600);
    return () => clearTimeout(t);
  }, [mode, mounted, files, go]);

  function load(next: Mode, f: ExerciseFiles) {
    setMode(next);
    setPart(mod(next).parts[0]);
    setFiles(f);
    setVersion((v) => v + 1);
    setOut(null);
    setNotes([]);
    setTabTitle("");
  }

  function edit(p: Part, v: string) {
    const next = { ...files, [p]: v };
    setFiles(next);
    try { localStorage.setItem(key(mode), JSON.stringify(next)); } catch {}
  }

  function reset() {
    try { localStorage.removeItem(key(mode)); } catch {}
    load(mode, cfg.examples[0].files);
  }

  function example(f: ExerciseFiles) {
    try { localStorage.setItem(key(mode), JSON.stringify(f)); } catch {}
    load(mode, f);
  }

  const tab = (on: boolean) => `min-h-9 rounded-full px-3.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent ${on ? "bg-noir text-on-noir" : "text-zinc-300 hover:bg-zinc-700"}`;

  return (
    <section aria-label="Playground kode" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Bahasa" className="inline-flex rounded-full border-2 border-noir bg-zinc-900 p-1">
          {MODES.map((m) => (
            <button key={m.id} type="button" role="tab" aria-selected={mode === m.id} onClick={() => load(m.id, read(m.id))} className={`min-h-10 rounded-full px-5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-accent ${mode === m.id ? "bg-noir text-on-noir" : "text-zinc-300 hover:bg-zinc-800"}`}>{m.label}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Contoh kode">
          <span className="text-sm text-zinc-400">Mulai dari contoh:</span>
          {cfg.examples.map((e) => (
            <button key={e.label} type="button" onClick={() => example(e.files)} className="min-h-9 rounded-full bg-zinc-900 px-3.5 text-sm font-medium text-zinc-300 shadow-soft hover:bg-zinc-800 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent">{e.label}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={panel} onKeyDownCapture={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.stopPropagation(); go(); } }}>
          <div className={bar}>
            {cfg.parts.length > 1 ? (
              <div role="tablist" aria-label="Berkas" className="flex gap-1">
                {cfg.parts.map((p) => <button key={p} type="button" role="tab" aria-selected={part === p} onClick={() => setPart(p)} className={tab(part === p)}>{LABEL[p]}</button>)}
              </div>
            ) : <span className="px-1 font-mono text-sm font-semibold text-zinc-300">{cfg.file}</span>}
            <span className="ml-auto flex gap-2">
              <button type="button" onClick={reset} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700" title="Kembalikan ke contoh pertama"><RotateCcw aria-hidden className="size-4" />Reset</button>
              {mode !== "web" && <button type="button" onClick={go} disabled={busy} className={`${primaryButton} min-h-9! px-4! text-sm`} title="Ctrl + Enter"><Play aria-hidden className="size-4" />{busy ? "Berjalan..." : "Jalankan"}</button>}
            </span>
          </div>
          <div className={`${body} text-[0.95rem] [&_.cm-editor]:h-full! [&_.cm-editor]:max-h-none! [&_.cm-editor]:min-h-0! [&_.cm-scroller]:overflow-auto [&_.code-editor]:h-full [&_.code-editor]:rounded-none`}>
            {mounted ? (
              <Suspense fallback={skeleton}>
                <CodeEditor key={`${mode}-${part}-${version}`} value={files[part] ?? ""} onChange={(v) => edit(part, v)} language={mode === "python" ? "python" : LANG[part]} label={`Editor ${LABEL[part]}`} />
              </Suspense>
            ) : skeleton}
          </div>
        </div>

        <div className={panel}>
          <div className={bar}>
            <h2 className="px-1 text-sm font-bold">{mode === "web" ? "Hasil" : "Keluaran"}</h2>
            <span aria-live="polite" className="ml-auto px-1 text-xs text-zinc-500">{mode === "web" ? "Diperbarui otomatis saat kamu mengetik" : "Ctrl + Enter untuk menjalankan"}</span>
          </div>
          {mode === "web" && (
            <div className="flex items-end gap-3 border-b-2 border-noir bg-zinc-800 px-3 pt-2">
              <div className="flex min-w-0 max-w-[16rem] items-center gap-2 rounded-t-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium" title="Judul tab browser, dari tag <title>">
                <Globe aria-hidden className="size-3.5 shrink-0 text-zinc-400" />
                <span className={`truncate ${tabTitle ? "" : "text-zinc-500"}`}>{tabTitle || "Tanpa judul"}</span>
              </div>
              <p className="min-w-0 pb-1.5 text-xs text-zinc-500">{tabTitle ? "Judul tab dari tag <title>" : "Tambahkan <title> di <head> agar tab punya nama"}</p>
            </div>
          )}
          {mode === "web" && notes.length > 0 && (
            <ul className="grid gap-1 border-b-2 border-noir bg-tile-butter px-4 py-3 text-sm text-zinc-50">
              {notes.map((n) => <li key={n}><span className="font-semibold">Catatan:</span> {n}</li>)}
            </ul>
          )}
          {mode === "web" ? (
            <iframe ref={preview} title="Hasil" sandbox="allow-scripts" className={`${body} w-full border-0 bg-white`} />
          ) : (
            <div aria-live="polite" className={`${body} overflow-auto bg-zinc-950 p-4`}>
              {out?.error && <p className="mb-3 rounded-xl bg-tile-pink px-4 py-3 text-sm"><span className="font-semibold">Error:</span> {out.error}</p>}
              {out && out.logs.length > 0 && <pre className="text-sm"><code className="font-mono">{out.logs.join("\n")}</code></pre>}
              {!out && <p className="text-sm text-zinc-500">Tekan Jalankan, hasilnya muncul di sini.</p>}
              {out && !out.error && out.logs.length === 0 && <p className="text-sm text-zinc-500">Kode berjalan tanpa keluaran. Coba <code className="font-mono">console.log</code> atau <code className="font-mono">print</code>.</p>}
            </div>
          )}
          {mode === "web" && out?.error && <p className="border-t-2 border-noir bg-tile-pink px-4 py-3 text-sm"><span className="font-semibold">Error:</span> {out.error}</p>}
          {mode === "web" && out && out.logs.length > 0 && <pre className="max-h-32 overflow-auto border-t-2 border-noir bg-zinc-950 px-4 py-3 text-sm"><code className="font-mono">{out.logs.join("\n")}</code></pre>}
        </div>
      </div>
    </section>
  );
}
