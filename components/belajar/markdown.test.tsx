import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import ChapterMarkdown from "./markdown";

const slides = [1, 2].map((index) => ({ index, src: `https://x/s/slide-0${index}.avif`, width: 3200, height: 1800 }));
const html = (body: string) => renderToStaticMarkup(<ChapterMarkdown body={body} slides={slides} highlight={false} />);

test("slide:N embeds the 1600px slide", () => {
  expect(html("![Diagram](slide:2)")).toContain('src="https://x/s/slide-02-1600.avif"');
});

test("an unknown slide renders nothing", () => {
  const out = html("![x](slide:99) ![y](slide:abc)");
  expect(out).not.toContain("<img");
});

test("raw HTML in the body is not rendered", () => {
  // Shown as escaped text at most, never as a live tag.
  expect(html("<script>alert(1)</script><img src=x onerror=alert(1)>")).not.toMatch(/<script|<img[^>]*onerror/);
});

test("fenced code without highlighting stays a plain pre", () => {
  expect(html("```js\nconst a = 1;\n```")).toContain("<pre");
});

test("gambar:name embeds the diagram as a figure with a caption", () => {
  const out = html("![Urutan warna](gambar:utp-t568a-t568b)");
  expect(out).toContain('src="/praktik/utp-t568a-t568b.svg"');
  expect(out).toContain("<figcaption");
  expect(out).toContain("Urutan warna</figcaption>");
});

test("gambar: refuses path traversal and invalid names", () => {
  expect(html("![x](gambar:../../etc/passwd)")).not.toContain("<img");
  expect(html("![x](gambar:ABC)")).not.toContain("<img");
});

test("a diagram alt text is escaped, never a live tag", () => {
  expect(html("![<script>alert(1)</script>](gambar:abc)")).not.toContain("<script");
});

test("an empty alt falls back to the name and has no caption", () => {
  const out = html("![](gambar:utp-t568a-t568b)");
  expect(out).toContain('alt="Diagram utp-t568a-t568b"');
  expect(out).not.toContain("<figcaption");
});
