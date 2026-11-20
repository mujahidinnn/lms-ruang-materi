// Error budget berbasis waktu untuk periode 30 hari. Murni, tanpa DOM.
export const MENIT = 30 * 24 * 60;
export type Status = "aman" | "waspada" | "habis";

const bulat = (x: number) => Math.round(x * 100) / 100;
export const budget = (slo: number) => bulat((MENIT * (100 - slo)) / 100);

export function hitung(slo: number, insiden: number[]) {
  const b = budget(slo);
  const pakai = insiden.reduce((a, x) => a + x, 0);
  const sisa = bulat(b - pakai);
  const persenSisa = Math.max(0, Math.round((sisa / b) * 1000) / 10);
  const status: Status = sisa <= 0 ? "habis" : persenSisa > 50 ? "aman" : "waspada";
  return { budget: b, pakai, sisa, persenSisa, lebih: Math.max(0, -sisa), status, aktual: bulat(100 - (pakai / MENIT) * 100) };
}

export const saran: Record<Status, string> = {
  aman: "budget masih banyak. rilis fitur boleh jalan cepat.",
  waspada: "budget tinggal separuh atau kurang. rilis hati-hati, utamakan keandalan.",
  habis: "budget habis. bekukan rilis fitur sampai keandalan pulih.",
};

export const fmt = (x: number) => String(bulat(x)).replace(".", ",");
