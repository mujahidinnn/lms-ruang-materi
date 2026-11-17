import { useEffect, useRef } from "react";

// A black panel (bg-noir stays black in both themes, GUIDELINE Style) with
// matcha for the prompt and values. Pink is the one off-palette hue: it means wrong.
const PROMPT = "[admin@MikroTik] > ";
// The prompt follows /system identity, so match any name.
const PROMPT_RE = /^\[[^\]]+\] > /;
const ERROR = /^(bad command name|expected end of command|failure:|input does not match|syntax error|invalid value|no such item|ambiguous|not enough|too many|unknown)/i;

function lineClass(l: string) {
  if (ERROR.test(l)) return "whitespace-pre-wrap text-[#f5b4a6] [overflow-wrap:anywhere]";
  return /^(#|Flags:|Columns:)/.test(l) ? "whitespace-pre text-on-noir/45" : "whitespace-pre";
}

function Command({ line }: { line: string }) {
  const prompt = PROMPT_RE.exec(line)![0];
  const toks = line.slice(prompt.length).split(" ");
  const i = toks.findIndex((t) => t.includes("="));
  const path = (i < 0 ? toks : toks.slice(0, i)).join(" ");
  const params = i < 0 ? [] : toks.slice(i);
  return (
    <div className="whitespace-pre-wrap pl-[2ch] indent-[-2ch] [overflow-wrap:anywhere]">
      <span className="font-semibold text-matcha-300">{prompt}</span>
      <span className="font-semibold text-on-noir">{path}</span>
      {params.map((t, k) => {
        const eq = t.indexOf("=");
        return eq < 0 ? <span key={k} className="text-on-noir"> {t}</span> : (
          <span key={k}> <span className="text-on-noir/55">{t.slice(0, eq + 1)}</span><span className="text-primary">{t.slice(eq + 1)}</span></span>
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
    <figure className="overflow-hidden rounded-2xl bg-noir text-[13px] leading-6 text-on-noir shadow-soft">
      <figcaption className="flex items-center gap-2 bg-white/[0.06] px-4 py-2.5">
        <span aria-hidden className="size-3 rounded-full bg-matcha-200" />
        <span aria-hidden className="size-3 rounded-full bg-matcha-300" />
        <span aria-hidden className="size-3 rounded-full bg-matcha-500" />
        <span className="ml-2 font-mono text-xs text-on-noir/60">admin@MikroTik</span>
        <span className="ml-auto rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-on-primary">simulator</span>
      </figcaption>
      <div ref={body} role="log" aria-label="Keluaran terminal" tabIndex={0} className="scrollbar-thin max-h-80 overflow-auto px-4 py-3 font-mono text-on-noir/85 focus-visible:outline-2 focus-visible:outline-accent">
        {lines.map((l, k) =>
          PROMPT_RE.test(l) ? <Command key={k} line={l} /> : (
            <div key={k} className={lineClass(l)}>{l || " "}</div>
          )
        )}
        <div aria-hidden><span className="font-semibold text-matcha-300">{prompt}</span><span className="inline-block h-[1.1em] w-2 translate-y-[3px] bg-matcha-300 motion-safe:animate-pulse" /></div>
      </div>
    </figure>
  );
}
