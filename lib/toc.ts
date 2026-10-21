// The chapter's "Di bab ini" list: its ## headings, with the same ids
// MarkdownBase gives them.

export function headingId(text: string): string {
  return text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function toc(body: string): { id: string; text: string }[] {
  const out: { id: string; text: string }[] = [];
  let fenced = false;
  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const m = !fenced && /^## (.+)$/.exec(line);
    if (m) {
      const text = m[1].replace(/[`*_]/g, "").trim();
      out.push({ id: headingId(text), text });
    }
  }
  return out;
}

// The body cut at its ## headings, so the page can give sections their own
// look (Tujuan, Rangkuman). The first entry is the text before the first
// heading (id and title ""), possibly empty.
export function sections(body: string): { id: string; title: string; body: string }[] {
  const out = [{ id: "", title: "", body: "" }];
  let fenced = false;
  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const m = !fenced && /^## (.+)$/.exec(line);
    if (m) {
      const title = m[1].replace(/[`*_]/g, "").trim();
      out.push({ id: headingId(title), title, body: "" });
    } else out[out.length - 1].body += line + "\n";
  }
  return out;
}
