// SHA-256 hex and bit-diff helpers (Web Crypto, browser and Node 20+).
export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

const POP = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

/** Number of differing bits between two equal-length hex strings. */
export function bitDiff(a: string, b: string): number {
  let n = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) n += POP[parseInt(a[i], 16) ^ parseInt(b[i], 16)];
  return n;
}

export const bitDiffPercent = (a: string, b: string) => (bitDiff(a, b) / (a.length * 4)) * 100;

/** Indexes of hex characters that differ. */
export function diffIndexes(a: string, b: string): Set<number> {
  const s = new Set<number>();
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) s.add(i);
  return s;
}

/** Change exactly one letter/character (cycles by `n` so repeated clicks differ). Empty input becomes "a". */
export function changeOneChar(text: string, n: number): string {
  if (!text) return "a";
  const i = n % text.length;
  const c = text[i];
  const next = /[a-y]/.test(c) || /[A-Y]/.test(c) || /[0-8]/.test(c) ? String.fromCharCode(c.charCodeAt(0) + 1) : c === "z" ? "a" : c === "Z" ? "A" : c === "9" ? "0" : "x";
  return text.slice(0, i) + (next === c ? "x" : next) + text.slice(i + 1);
}
