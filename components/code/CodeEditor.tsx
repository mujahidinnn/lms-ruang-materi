"use client";

import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView, basicSetup } from "codemirror";
import { useEffect, useRef } from "react";

const LANG = { html, css, javascript };
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
