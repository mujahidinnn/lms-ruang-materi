export function parseHex(s: string): [number, number, number] | null {
  let h = s.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(h)) h = [...h].map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

// Rumus WCAG 2.x relative luminance.
export function luminance([r, g, b]: [number, number, number]) {
  const [R, G, B] = [r, g, b].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrast(a: string, b: string): number | null {
  const x = parseHex(a), y = parseHex(b);
  if (!x || !y) return null;
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

export const verdicts = (r: number) => [
  { label: "AA teks normal", min: 4.5, ok: r >= 4.5 },
  { label: "AA teks besar", min: 3, ok: r >= 3 },
  { label: "AAA teks normal", min: 7, ok: r >= 7 },
];
