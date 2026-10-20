import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bash from "shiki/langs/bash.mjs";
import css from "shiki/langs/css.mjs";
import diff from "shiki/langs/diff.mjs";
import dockerfile from "shiki/langs/dockerfile.mjs";
import html from "shiki/langs/html.mjs";
import ini from "shiki/langs/ini.mjs";
import javascript from "shiki/langs/javascript.mjs";
import json from "shiki/langs/json.mjs";
import jsx from "shiki/langs/jsx.mjs";
import markdown from "shiki/langs/markdown.mjs";
import sql from "shiki/langs/sql.mjs";
import tsx from "shiki/langs/tsx.mjs";
import typescript from "shiki/langs/typescript.mjs";
import vue from "shiki/langs/vue.mjs";
import xml from "shiki/langs/xml.mjs";
import yaml from "shiki/langs/yaml.mjs";
import githubDark from "shiki/themes/github-dark.mjs";
import githubLight from "shiki/themes/github-light.mjs";
import { Copy } from "lucide-react";

// Synchronous, so chapter bodies render in one pass on the server. The
// languages the decks use; anything else is shown as plain text.
const shiki = createHighlighterCoreSync({
  themes: [githubLight, githubDark],
  langs: [bash, css, diff, dockerfile, html, ini, javascript, json, jsx, markdown, sql, tsx, typescript, vue, xml, yaml],
  engine: createJavaScriptRegexEngine(),
});
const themes = { light: "github-light", dark: "github-dark" };

function highlight(code: string, lang: string): string {
  const known = shiki.getLoadedLanguages().includes(lang) ? lang : "text";
  try {
    return shiki.codeToHtml(code, { lang: known, themes, defaultColor: false });
  } catch {
    return shiki.codeToHtml(code, { lang: "text", themes, defaultColor: false });
  }
}

// Highlighted on the server; shiki escapes the code, so the HTML is safe.
// Both themes are emitted as CSS variables and globals.css picks one. The
// copy button works through the delegated script in src/components/CopyCode.astro.
export default function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="relative my-5">
      <div className="scrollbar-thin overflow-x-auto rounded-2xl bg-zinc-900 p-5 text-sm shadow-soft" dangerouslySetInnerHTML={{ __html: highlight(code, lang) }} />
      <button
        type="button"
        data-copy={code}
        aria-label="Salin kode"
        className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-zinc-900 text-zinc-400 shadow-soft hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Copy aria-hidden className="size-4" />
      </button>
    </div>
  );
}
