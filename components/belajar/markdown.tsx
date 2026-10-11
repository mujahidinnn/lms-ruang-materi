import type { Slide } from "@/lib/slides";
import CodeBlock from "./CodeBlock";
import MarkdownBase from "./MarkdownBase";

// Public chapter body: MarkdownBase with shiki-highlighted code blocks.
// highlight={false} skips shiki (tests, previews).
export default function ChapterMarkdown({ body, slides, highlight = true }: { body: string; slides: Slide[]; highlight?: boolean }) {
  return (
    <MarkdownBase
      body={body}
      slides={slides}
      renderCode={highlight ? (code, lang) => <CodeBlock code={code} lang={lang} /> : undefined}
    />
  );
}
