import Markdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveSlideRef } from "@/lib/chapters";
import { mediumSrc, type Slide } from "@/lib/slides";
import { Children, isValidElement, type ReactNode } from "react";
import { headingId } from "@/lib/toc";

// Plain text of rendered children, for heading ids.
function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((c) => (typeof c === "string" || typeof c === "number" ? String(c) : isValidElement<{ children?: ReactNode }>(c) ? textOf(c.props.children) : ""))
    .join("");
}

// Chapter bodies are markdown from AI drafts or admins: raw HTML is never
// rendered (no rehype-raw). `slide:N` image sources become slide embeds.
// No shiki here, so the admin editor can use it in the browser; the public
// page passes a highlighted renderCode (markdown.tsx).
export default function MarkdownBase({
  body,
  slides,
  renderCode,
  className = "",
}: {
  body: string;
  slides: Slide[];
  renderCode?: (code: string, lang: string) => ReactNode;
  className?: string;
}) {
  return (
    <div className={`prose-chapter ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => (url.startsWith("slide:") ? url : defaultUrlTransform(url))}
        components={{
          img: ({ src, alt }) => {
            const slide = typeof src === "string" ? resolveSlideRef(src, slides) : null;
            if (!slide) return null;
            return (
              <a href={slide.src} target="_blank" rel="noopener" className="my-5 block overflow-hidden rounded-2xl shadow-soft">
                <img src={mediumSrc(slide)} width={slide.width} height={slide.height} alt={alt || `Slide ${slide.index}`} loading="lazy" className="h-auto w-full" />
              </a>
            );
          },
          // Ids match lib/toc.ts, so "Di bab ini" can link to each section.
          h2: ({ children }) => <h2 id={headingId(textOf(children).replace(/[`*_]/g, ""))} className="scroll-mt-24">{children}</h2>,
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const text = String(children ?? "");
            const lang = /language-(\w+)/.exec(className ?? "")?.[1];
            const block = lang !== undefined || text.includes("\n");
            if (!block) return <code className="rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>;
            const code = text.replace(/\n$/, "");
            return renderCode ? (
              renderCode(code, lang ?? "text")
            ) : (
              <pre className="scrollbar-thin my-5 overflow-x-auto rounded-2xl bg-zinc-900 p-5 text-sm shadow-soft"><code className="font-mono">{code}</code></pre>
            );
          },
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">{children}</a>
          ),
        }}
      >
        {body}
      </Markdown>
    </div>
  );
}
