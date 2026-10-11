import Markdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveSlideRef } from "@/lib/chapters";
import { mediumSrc, type Slide } from "@/lib/slides";
import CodeBlock from "./CodeBlock";

// Chapter bodies are markdown from AI drafts or admins: raw HTML is never
// rendered (no rehype-raw). `slide:N` image sources become slide embeds.
export default function ChapterMarkdown({ body, slides, highlight = true }: { body: string; slides: Slide[]; highlight?: boolean }) {
  return (
    <div className="prose-chapter">
      <Markdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => (url.startsWith("slide:") ? url : defaultUrlTransform(url))}
        components={{
          img: ({ src, alt }) => {
            const slide = typeof src === "string" ? resolveSlideRef(src, slides) : null;
            if (!slide) return null;
            return (
              <a href={slide.src} target="_blank" rel="noopener" className="my-5 block overflow-hidden rounded-2xl shadow-soft">
                {/* eslint-disable-next-line @next/next/no-img-element -- pre-encoded AVIF, see next.config.ts */}
                <img src={mediumSrc(slide)} width={slide.width} height={slide.height} alt={alt || `Slide ${slide.index}`} loading="lazy" className="h-auto w-full" />
              </a>
            );
          },
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const text = String(children ?? "");
            const lang = /language-(\w+)/.exec(className ?? "")?.[1];
            const block = lang !== undefined || text.includes("\n");
            if (!block) return <code className="rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>;
            const code = text.replace(/\n$/, "");
            return highlight ? (
              <CodeBlock code={code} lang={lang ?? "text"} />
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
