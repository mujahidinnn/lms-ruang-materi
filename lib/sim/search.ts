// lo..hi is the range still in play; everything outside it has been ruled out.
export type SearchStep = { at: number; lo: number; hi: number; cmp: number; done: boolean; found: number; note: string };

export function linearSteps(a: number[], x: number): SearchStep[] {
  const n = a.length;
  const s: SearchStep[] = [{ at: -1, lo: 0, hi: n - 1, cmp: 0, done: false, found: -1, note: `Mencari ${x} dari depan, satu per satu.` }];
  for (let i = 0; i < n; i++) {
    const hit = a[i] === x;
    s.push({ at: i, lo: i, hi: n - 1, cmp: i + 1, done: hit, found: hit ? i : -1, note: hit ? `a[${i}] = ${x}: ketemu di indeks ${i}.` : `a[${i}] = ${a[i]}, bukan ${x}. Lanjut.` });
    if (hit) return s;
  }
  s.push({ at: -1, lo: n, hi: n - 1, cmp: n, done: true, found: -1, note: `Semua ${n} elemen diperiksa: ${x} tidak ada.` });
  return s;
}

export function binarySteps(a: number[], x: number): SearchStep[] {
  let lo = 0, hi = a.length - 1, cmp = 0;
  const s: SearchStep[] = [{ at: -1, lo, hi, cmp, done: false, found: -1, note: `Mencari ${x} di list terurut: tebak elemen tengah, buang separuh.` }];
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    cmp++;
    const v = a[mid];
    if (v === x) { s.push({ at: mid, lo, hi, cmp, done: true, found: mid, note: `a[${mid}] = ${x}: ketemu di indeks ${mid}.` }); return s; }
    const right = v < x;
    s.push({ at: mid, lo, hi, cmp, done: false, found: -1, note: right ? `a[${mid}] = ${v} < ${x}: buang separuh kiri.` : `a[${mid}] = ${v} > ${x}: buang separuh kanan.` });
    if (right) lo = mid + 1; else hi = mid - 1;
  }
  s.push({ at: -1, lo, hi, cmp, done: true, found: -1, note: `Ruang pencarian habis: ${x} tidak ada.` });
  return s;
}
