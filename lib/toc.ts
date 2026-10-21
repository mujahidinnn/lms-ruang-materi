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
