export type Kind = "bubble" | "selection" | "insertion" | "merge" | "quick";
export type SortStep = { arr: number[]; hi: number[]; done: number[]; cmp: number; swp: number; note: string };

export const KINDS: { id: Kind; label: string; big: string }[] = [
  { id: "bubble", label: "Bubble", big: "O(n²)" },
  { id: "selection", label: "Selection", big: "O(n²)" },
  { id: "insertion", label: "Insertion", big: "O(n²), hampir terurut O(n)" },
  { id: "merge", label: "Merge", big: "O(n log n)" },
  { id: "quick", label: "Quick", big: "rata-rata O(n log n), terburuk O(n²)" },
];

// Every algorithm records a snapshot per comparison/swap. For merge sort a "pertukaran" is one write into the array.
export function sortSteps(kind: Kind, data: number[]): SortStep[] {
  const a = [...data];
  const n = a.length;
  let cmp = 0;
  let swp = 0;
  const done = new Set<number>();
  const steps: SortStep[] = [];
  const push = (hi: number[], note: string) => steps.push({ arr: [...a], hi, done: [...done], cmp, swp, note });
  const swap = (i: number, j: number) => { [a[i], a[j]] = [a[j], a[i]]; swp++; };

  push([], "Data awal. Tekan Putar atau Langkah.");

  if (kind === "bubble") {
    for (let end = n - 1; end > 0; end--) {
      let sw = false;
      for (let j = 0; j < end; j++) {
        cmp++;
        const [x, y] = [a[j], a[j + 1]];
        if (x > y) { swap(j, j + 1); sw = true; push([j, j + 1], `${x} lebih besar dari ${y}, keduanya bertukar.`); }
        else push([j, j + 1], `${x} dan ${y} sudah berurutan.`);
      }
      done.add(end);
      if (!sw) { for (let k = 0; k < end; k++) done.add(k); break; }
    }
  } else if (kind === "selection") {
    for (let i = 0; i < n - 1; i++) {
      let m = i;
      for (let j = i + 1; j < n; j++) {
        cmp++;
        const smaller = a[j] < a[m];
        const note = smaller ? `${a[j]} lebih kecil dari ${a[m]}: minimum baru.` : `${a[j]} tidak lebih kecil dari ${a[m]}.`;
        if (smaller) m = j;
        push([m, j], note);
      }
      if (m !== i) { const v = a[m]; swap(i, m); push([i, m], `Minimum ${v} ditukar ke posisi ${i}.`); }
      done.add(i);
    }
  } else if (kind === "insertion") {
    for (let i = 1; i < n; i++) {
      for (let j = i; j > 0; j--) {
        cmp++;
        const [x, y] = [a[j - 1], a[j]];
        if (x > y) { swap(j - 1, j); push([j - 1, j], `${x} lebih besar dari ${y}, ${y} bergeser ke kiri.`); }
        else { push([j - 1, j], `${x} tidak lebih besar dari ${y}: ${y} sudah di tempatnya.`); break; }
      }
    }
  } else if (kind === "merge") {
    const ms = (lo: number, hi: number) => {
      if (hi <= lo) return;
      const mid = (lo + hi) >> 1;
      ms(lo, mid);
      ms(mid + 1, hi);
      const L = a.slice(lo, mid + 1);
      const R = a.slice(mid + 1, hi + 1);
      let i = 0, j = 0, k = lo;
      while (i < L.length || j < R.length) {
        let v: number;
        let note: string;
        if (i < L.length && j < R.length) {
          cmp++;
          if (L[i] <= R[j]) { v = L[i++]; note = `Ambil ${v} (kiri) karena tidak lebih besar dari ${R[j]}.`; }
          else { v = R[j++]; note = `Ambil ${v} (kanan) karena lebih kecil dari ${L[i]}.`; }
        } else { v = i < L.length ? L[i++] : R[j++]; note = `Salin sisa: ${v}.`; }
        a[k] = v;
        swp++;
        push([k], `${note} Tulis ke posisi ${k}.`);
        k++;
      }
    };
    ms(0, n - 1);
  } else {
    const qs = (lo: number, hi: number) => {
      if (lo > hi) return;
      if (lo === hi) { done.add(lo); push([lo], `Satu elemen (${a[lo]}) sudah di tempatnya.`); return; }
      const p = a[hi];
      let i = lo;
      push([hi], `Pivot ${p} dipilih dari ujung kanan.`);
      for (let j = lo; j < hi; j++) {
        cmp++;
        const v = a[j];
        if (v < p) { const from = i; if (i !== j) swap(i, j); i++; push([from, j], `${v} lebih kecil dari pivot ${p}: pindah ke sisi kiri.`); }
        else push([j, hi], `${v} tidak lebih kecil dari pivot ${p}: tetap di sisi kanan.`);
      }
      if (i !== hi) swap(i, hi);
      done.add(i);
      push([i], `Pivot ${p} menempati posisi akhirnya (${i}).`);
      qs(lo, i - 1);
      qs(i + 1, hi);
    };
    qs(0, n - 1);
  }

  for (let i = 0; i < n; i++) done.add(i);
  push([], "Selesai: data terurut.");
  return steps;
}
