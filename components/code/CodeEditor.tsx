"use client";

import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { EditorView, basicSetup } from "codemirror";
import { useEffect, useRef } from "react";

const LANG = { html, css, javascript, python };

// Token colors are CSS variables (globals.css) so they follow the theme;
// basicSetup's default style is only a fallback.
const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: "var(--code-keyword)" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "var(--code-string)" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "var(--code-number)" },
  { tag: [t.comment, t.meta], color: "var(--code-comment)", fontStyle: "italic" },
  { tag: [t.definition(t.variableName), t.function(t.variableName), t.tagName], color: "var(--code-def)" },
  { tag: [t.propertyName, t.attributeName], color: "var(--code-prop)" },
]);
export type EditorLanguage = keyof typeof LANG;

// CodeMirror 6, uncontrolled after mount: value seeds it, every edit is
// reported through onChange. Remount (key) to load different content.
export default function CodeEditor({ value, onChange, language, label }: { value: string; onChange: (v: string) => void; language: EditorLanguage; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const changed = useRef(onChange);

  useEffect(() => {
    changed.current = onChange;
  });

  useEffect(() => {
    const view = new EditorView({
      doc: value,
      parent: host.current!,
      extensions: [
        basicSetup,
        LANG[language](),
        syntaxHighlighting(highlight),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ "aria-label": label }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) changed.current(u.state.doc.toString());
        }),
      ],
    });
    return () => view.destroy();
    // value only seeds the editor; see the comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, label]);

  return <div ref={host} className="code-editor overflow-hidden rounded-2xl bg-zinc-950 text-sm" />;
}
