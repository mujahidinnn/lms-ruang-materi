import Markdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { diagramSrc, parseDiagramRef, parseSimRef, resolveSlideRef } from "@/lib/chapters";
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
        urlTransform={(url) => (url.startsWith("slide:") || url.startsWith("gambar:") || url.startsWith("sim:") ? url : defaultUrlTransform(url))}
        components={{
          img: ({ src, alt }) => {
            // Hydrated in the browser by ReaderScripts; this text is the fallback.
            const sim = typeof src === "string" ? parseSimRef(src) : null;
            if (sim) return <span data-sim={sim} data-title={alt} className="my-5 block rounded-[18px] bg-zinc-900 p-5 text-sm text-zinc-400 shadow-soft">Simulasi interaktif: {alt || sim}</span>;
            const diagram = typeof src === "string" ? parseDiagramRef(src) : null;
            if (diagram) {
              return (
                <figure className="my-5 overflow-hidden rounded-xl shadow-soft">
                  {/* Diagrams are 1200 units wide; on a phone the labels shrink below 7px, so the picture keeps a 680px floor and scrolls inside the card. */}
                  <div className="scrollbar-thin overflow-x-auto bg-white">
                    <img src={diagramSrc(diagram)} alt={alt || `Diagram ${diagram}`} className="h-auto w-full min-w-[680px] bg-white" />
                  </div>
                  <p className="bg-white px-4 pb-2 text-xs text-zinc-500 sm:hidden">Geser ke samping untuk melihat seluruh diagram.</p>
                  {alt ? <figcaption className="bg-zinc-900 px-4 py-2 text-sm text-zinc-400">{alt}</figcaption> : null}
                </figure>
              );
            }
            // Pictures in public/studio/ (no dots in folder names, so no ..): GIFs, screenshots, illustrations.
            if (typeof src === "string" && /^\/studio\/(?:[a-z0-9][a-z0-9_-]*\/)*[a-z0-9][a-z0-9_-]*\.(webp|png|jpe?g|gif|svg)$/.test(src)) {
              return (
                <figure className="my-5 overflow-hidden rounded-xl shadow-soft">
                  <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" className="h-auto w-full bg-white" />
                  {alt ? <figcaption className="bg-zinc-900 px-4 py-2 text-sm text-zinc-400">{alt}</figcaption> : null}
                </figure>
              );
            }
            const slide = typeof src === "string" ? resolveSlideRef(src, slides) : null;
            if (!slide) return null;
            return (
              <a href={slide.src} target="_blank" rel="noopener" className="my-5 block overflow-hidden rounded-xl shadow-soft">
                <img src={mediumSrc(slide)} width={slide.width} height={slide.height} alt={alt || `Slide ${slide.index}`} loading="lazy" className="h-auto w-full" />
              </a>
            );
          },
          // Ids match lib/toc.ts, so "Di bab ini" can link to each section.
          h2: ({ children }) => <h2 id={headingId(textOf(children).replace(/[`*_]/g, ""))} className="scroll-mt-24">{children}</h2>,
          table: ({ children }) => <div className="table-wrap scrollbar-thin"><table>{children}</table></div>,
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const text = String(children ?? "");
            const lang = /language-(\w+)/.exec(className ?? "")?.[1];
            const block = lang !== undefined || text.includes("\n");
            if (!block) return <code className="rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.9em] break-words [overflow-wrap:anywhere]">{children}</code>;
            const code = text.replace(/\n$/, "");
            return renderCode ? (
              renderCode(code, lang ?? "text")
            ) : (
              <pre className="scrollbar-thin my-5 overflow-x-auto rounded-[18px] bg-zinc-900 p-5 text-sm shadow-soft"><code className="font-mono">{code}</code></pre>
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
