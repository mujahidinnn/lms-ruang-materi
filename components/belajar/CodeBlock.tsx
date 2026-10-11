import { codeToHtml } from "shiki";
import CopyCode from "./CopyCode";

// Shiki reads the clock while highlighting, which cacheComponents rejects
// during prerender; inside 'use cache' the result is cached instead.
async function highlight(code: string, lang: string): Promise<string> {
  "use cache";
  const themes = { light: "github-light", dark: "github-dark" };
  try {
    return await codeToHtml(code, { lang: lang || "text", themes, defaultColor: false });
  } catch {
    return codeToHtml(code, { lang: "text", themes, defaultColor: false });
  }
}

// Highlighted on the server; shiki escapes the code, so the HTML is safe.
// Both themes are emitted as CSS variables and globals.css picks one.
export default async function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const html = await highlight(code, lang);
  return (
    <div className="relative my-5">
      <div className="scrollbar-thin overflow-x-auto rounded-2xl bg-zinc-900 p-5 text-sm shadow-soft" dangerouslySetInnerHTML={{ __html: html }} />
      <CopyCode code={code} />
    </div>
  );
}
