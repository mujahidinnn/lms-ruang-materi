import { codeToHtml } from "shiki";
import CopyCode from "./CopyCode";

// Highlighted on the server; shiki escapes the code, so the HTML is safe.
// Both themes are emitted as CSS variables and globals.css picks one.
export default async function CodeBlock({ code, lang }: { code: string; lang: string }) {
  let html: string;
  try {
    html = await codeToHtml(code, { lang: lang || "text", themes: { light: "github-light", dark: "github-dark" }, defaultColor: false });
  } catch {
    html = await codeToHtml(code, { lang: "text", themes: { light: "github-light", dark: "github-dark" }, defaultColor: false });
  }
  return (
    <div className="relative my-5">
      <div className="scrollbar-thin overflow-x-auto rounded-2xl bg-zinc-900 p-5 text-sm shadow-soft" dangerouslySetInnerHTML={{ __html: html }} />
      <CopyCode code={code} />
    </div>
  );
}
