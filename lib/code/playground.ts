// The playground's web mode is one complete HTML file. The sandbox wants the
// parts apart (markup, CSS, and JS that runs through the loop guard), so the
// file is split here. Files that do not exist in the playground (style.css,
// script.js) are dropped with a note instead of failing silently.
const EXTERNAL = /^(https?:)?\/\//i;
const attr = (tag: string, name: string) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
};

export function splitDocument(src: string): { files: { html: string; css: string; js: string }; notes: string[] } {
  const notes: string[] = [];
  const css: string[] = [];
  const js: string[] = [];
  const html = src
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi, (_, c: string) => (css.push(c), ""))
    .replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (whole, attrs: string, body: string) => {
      const tag = `<script ${attrs}>`;
      const type = attr(tag, "type");
      if (type && !/javascript|module/i.test(type)) return whole; // JSON or template data stays put
      const from = attr(tag, "src");
      if (from) {
        if (EXTERNAL.test(from)) return whole;
        notes.push(`"${from}" tidak ada di playground. Tulis JavaScript-nya langsung di <script> dalam HTML ini.`);
        return "";
      }
      if (type && /module/i.test(type)) notes.push("Skrip type=\"module\" dijalankan sebagai skrip biasa, jadi import tidak jalan.");
      js.push(body);
      return "";
    })
    .replace(/<link\b[^>]*>/gi, (whole) => {
      if (!/rel\s*=\s*["']?stylesheet/i.test(whole)) return whole;
      const from = attr(whole, "href");
      if (!from || EXTERNAL.test(from)) return whole;
      notes.push(`"${from}" tidak ada di playground. Tulis CSS-nya langsung di <style> dalam HTML ini.`);
      return "";
    });
  return { files: { html, css: css.join("\n"), js: js.join("\n") }, notes: [...new Set(notes)] };
}
