// Sebaran latensi deterministik dan persentil nearest-rank. Murni, tanpa DOM.
export const EDGES = [25, 50, 75, 100, 150, 250, 500, 1000, 2000] as const;

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ekorPct: persen request lambat (0 sampai 10). Tiap request punya nasib tetap, jadi
// menaikkan ekor hanya menambah request lambat, tidak mengacak ulang yang lain.
export function data(n: number, ekorPct: number, seed = 7): number[] {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const badan = 20 + ((r() + r() + r()) / 3) * 100;
    const nasib = r();
    const lambat = 200 + r() * 1800;
    return Math.round(nasib < ekorPct / 100 ? lambat : badan);
  });
}

export function persentil(d: number[], p: number): number {
  const u = [...d].sort((a, b) => a - b);
  return u[Math.max(Math.ceil((p / 100) * u.length), 1) - 1];
}

export const rata = (d: number[]) => d.reduce((a, b) => a + b, 0) / d.length;

export function ringkas(d: number[]) {
  return { rata: rata(d), p50: persentil(d, 50), p95: persentil(d, 95), p99: persentil(d, 99) };
}

export function bucket(d: number[]): number[] {
  const c = EDGES.map(() => 0);
  for (const x of d) { const i = EDGES.findIndex((e) => x <= e); c[i < 0 ? EDGES.length - 1 : i]++; }
  return c;
}

// posisi pecahan pada sumbu bucket (0 sampai EDGES.length) untuk menaruh penanda
export function posisi(v: number): number {
  const i = EDGES.findIndex((e) => v <= e);
  if (i < 0) return EDGES.length;
  const lo = i === 0 ? 0 : EDGES[i - 1];
  return i + (v - lo) / (EDGES[i] - lo);
}
