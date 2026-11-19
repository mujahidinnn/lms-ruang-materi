export type Band = { name: string; hex: string };

export const DIGITS: Band[] = [
  { name: "hitam", hex: "#1a1a1a" }, { name: "coklat", hex: "#8b5a2b" }, { name: "merah", hex: "#d93a2b" },
  { name: "oranye", hex: "#f08a24" }, { name: "kuning", hex: "#f2d338" }, { name: "hijau", hex: "#3fa34d" },
  { name: "biru", hex: "#2f6fd6" }, { name: "ungu", hex: "#8a4fd1" }, { name: "abu-abu", hex: "#9ca3af" },
  { name: "putih", hex: "#f5f5f5" },
];
export const GOLD: Band = { name: "emas", hex: "#d4af37" };
export const SILVER: Band = { name: "perak", hex: "#c0c0c0" };

// Pengali: eksponen -2..9 (perak, emas, hitam..putih).
export const EXPS = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export const expBand = (e: number): Band => (e === -1 ? GOLD : e === -2 ? SILVER : DIGITS[e]);

export const TOLS: (Band & { pct: number })[] = [
  { ...DIGITS[1], pct: 1 }, { ...DIGITS[2], pct: 2 }, { ...DIGITS[5], pct: 0.5 }, { ...DIGITS[6], pct: 0.25 },
  { ...DIGITS[7], pct: 0.1 }, { ...GOLD, pct: 5 }, { ...SILVER, pct: 10 },
];

export const decode = (d1: number, d2: number, exp: number) => (d1 * 10 + d2) * 10 ** exp;

const num = (x: number) => String(+x.toFixed(2)).replace(".", ",");
export function format(ohms: number) {
  if (ohms >= 1e9) return `${num(ohms / 1e9)} GΩ`;
  if (ohms >= 1e6) return `${num(ohms / 1e6)} MΩ`;
  if (ohms >= 1e3) return `${num(ohms / 1e3)} kΩ`;
  return `${num(ohms)} Ω`;
}

// Nilai -> tiga gelang pertama; null jika tidak bisa dengan 2 angka signifikan.
export function encode(ohms: number): { d1: number; d2: number; exp: number } | null {
  if (!Number.isFinite(ohms) || ohms <= 0) return null;
  const exp = Math.floor(Math.log10(ohms)) - 1;
  const m = Math.round(ohms / 10 ** exp);
  if (Math.abs(m * 10 ** exp - ohms) > ohms * 1e-9 || m < 10 || m > 99 || exp < -2 || exp > 9) return null;
  return { d1: Math.floor(m / 10), d2: m % 10, exp };
}

// "4,7k", "4k7", "470", "2.2M", "100 ohm" -> ohm.
export function parse(text: string): number | null {
  const t = text.trim().toLowerCase().replace(/\s|ω|ohm/g, "").replace(",", ".");
  const m = /^(\d+)([kmgr])(\d+)$/.exec(t) ?? /^(\d*\.?\d+)([kmgr]?)$/.exec(t);
  if (!m) return null;
  const mult = { "": 1, r: 1, k: 1e3, m: 1e6, g: 1e9 }[m[2] as "" | "r" | "k" | "m" | "g"];
  const v = m[3] !== undefined ? +`${m[1]}.${m[3]}` : +m[1];
  return v * mult;
}
