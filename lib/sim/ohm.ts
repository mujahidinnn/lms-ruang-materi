export const RATING_W = 0.25; // resistor 1/4 W

// Hukum Ohm: I = V / R, P = V * I.
export function ohm(v: number, r: number) {
  const i = r > 0 ? v / r : 0;
  return { i, p: v * i };
}

export const overRating = (p: number, rating = RATING_W) => p > rating;

// Arus dengan satuan yang enak dibaca (koma desimal Indonesia).
export function fmt(x: number, unit: string) {
  const abs = Math.abs(x);
  const [v, pre] = abs >= 1 ? [x, ""] : abs >= 0.001 ? [x * 1e3, "m"] : [x * 1e6, "µ"];
  const s = (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(".", ",");
  return `${s} ${pre}${unit}`;
}
