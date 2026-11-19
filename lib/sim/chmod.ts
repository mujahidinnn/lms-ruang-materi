// bits: 9 boolean berurutan user r,w,x, group r,w,x, other r,w,x.
export type Bits = boolean[];

export const toOctal = (b: Bits) =>
  [0, 3, 6].map((i) => (b[i] ? 4 : 0) + (b[i + 1] ? 2 : 0) + (b[i + 2] ? 1 : 0)).join("");

export function fromOctal(s: string): Bits | null {
  if (!/^[0-7]{3}$/.test(s)) return null;
  return [...s].flatMap((c) => [4, 2, 1].map((v) => (+c & v) !== 0));
}

export const toSymbolic = (b: Bits) => b.map((on, i) => (on ? "rwx"[i % 3] : "-")).join("");

// Terima "rwxr-xr--" atau dengan karakter jenis di depan ("-rwxr-xr--"). Bit khusus (s, t) ditolak.
export function fromSymbolic(s: string): Bits | null {
  const t = s.length === 10 ? s.slice(1) : s;
  if (!/^[r-][w-][x-][r-][w-][x-][r-][w-][x-]$/.test(t)) return null;
  if (s.length === 10 && !/^[-dl]/.test(s)) return null;
  return [...t].map((c) => c !== "-");
}

export const WHO = ["Pemilik (user)", "Grup (group)", "Lainnya (other)"];
