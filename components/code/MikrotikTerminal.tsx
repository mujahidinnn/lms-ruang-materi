import { useEffect, useRef } from "react";

// Dark in both themes on purpose: a terminal looks like one. Colours are fixed,
// not theme tokens (zinc-950 flips to light in the light theme).
const PROMPT = "[admin@MikroTik] > ";
// The prompt follows /system identity, so match any name.
const PROMPT_RE = /^\[[^\]]+\] > /;
const ERROR = /^(bad command name|expected end of command|failure:|input does not match|syntax error|invalid value|no such item|ambiguous|not enough|too many|unknown)/i;

function lineClass(l: string) {
  if (ERROR.test(l)) return "whitespace-pre-wrap text-red-300 [overflow-wrap:anywhere]";
  return /^(#|Flags:|Columns:)/.test(l) ? "whitespace-pre text-slate-500" : "whitespace-pre";
}

function Command({ line }: { line: string }) {
  const prompt = PROMPT_RE.exec(line)![0];
  const toks = line.slice(prompt.length).split(" ");
  const i = toks.findIndex((t) => t.includes("="));
  const path = (i < 0 ? toks : toks.slice(0, i)).join(" ");
  const params = i < 0 ? [] : toks.slice(i);
  return (
    <div className="whitespace-pre-wrap pl-[2ch] indent-[-2ch] [overflow-wrap:anywhere]">
      <span className="font-semibold text-emerald-400">{prompt}</span>
      <span className="font-semibold text-slate-50">{path}</span>
      {params.map((t, k) => {
        const eq = t.indexOf("=");
        return eq < 0 ? <span key={k} className="text-slate-50"> {t}</span> : (
          <span key={k}> <span className="text-sky-300">{t.slice(0, eq + 1)}</span><span className="text-amber-300">{t.slice(eq + 1)}</span></span>
        );
      })}
    </div>
  );
}

export default function MikrotikTerminal({ lines }: { lines: string[] }) {
  const body = useRef<HTMLDivElement>(null);
  // Newest output first in view, like a real terminal.
  const last = [...lines].reverse().find((l) => PROMPT_RE.test(l));
  const prompt = last ? PROMPT_RE.exec(last)![0] : PROMPT;
  useEffect(() => { body.current?.scrollTo({ top: body.current.scrollHeight }); }, [lines]);
  return (
    <figure className="overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0b1220] text-[13px] leading-6 shadow-lg">
      <figcaption className="flex items-center gap-2 border-b border-slate-700/60 bg-[#111a2e] px-4 py-2.5">
        <span aria-hidden className="size-3 rounded-full bg-red-500" />
        <span aria-hidden className="size-3 rounded-full bg-amber-400" />
        <span aria-hidden className="size-3 rounded-full bg-emerald-500" />
        <span className="ml-2 font-mono text-xs text-slate-400">admin@MikroTik - simulator</span>
      </figcaption>
      <div ref={body} role="log" aria-label="Keluaran terminal" tabIndex={0} className="scrollbar-thin max-h-80 overflow-auto px-4 py-3 font-mono text-slate-300 focus-visible:outline-2 focus-visible:outline-accent">
        {lines.map((l, k) =>
          PROMPT_RE.test(l) ? <Command key={k} line={l} /> : (
            <div key={k} className={lineClass(l)}>{l || " "}</div>
          )
        )}
        <div aria-hidden><span className="font-semibold text-emerald-400">{prompt}</span><span className="inline-block h-[1.1em] w-2 translate-y-[3px] bg-emerald-400 motion-safe:animate-pulse" /></div>
      </div>
    </figure>
  );
}
