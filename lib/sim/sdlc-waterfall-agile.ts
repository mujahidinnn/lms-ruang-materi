// Model sederhana (satuan: minggu). Proyek 6 fitur; perubahan menyentuh fitur 2 dan 4
// dan datang di 50% jadwal dasar masing-masing pendekatan.
// Waterfall: kebutuhan 2, desain 2, bangun 1/fitur, uji 2, rilis 1. Perubahan = ulang
// kebutuhan + desain, bangun ulang fitur terdampak yang sudah jadi, uji ulang 1.
// Agile: sprint 3 minggu (2 fitur + 1 minggu rencana/review). Perubahan masuk backlog,
// hanya fitur terdampak yang sudah dirilis dikerjakan ulang di sprint berikutnya.
export const FEATURES = 6;
export const AFFECTED = [2, 4];

export type Kind = "kerja" | "ulang";
export type Seg = { id: string; label: string; start: number; len: number; kind: Kind };
export type Plan = {
  segs: Seg[];
  total: number;
  changeAt: number | null;
  firstWorking: number;
  rework: number;
  feedback: number;
  /** akhir tiap pengiriman: waktu dan jumlah fitur yang sudah berfungsi */
  releases: { at: number; features: number }[];
};

const lay = (items: [string, number, Kind?][]): Seg[] => {
  let t = 0;
  return items.map(([label, len, kind = "kerja"], i) => {
    const s = { id: `${i}`, label, start: t, len, kind };
    t += len;
    return s;
  });
};

export function waterfall(change: boolean): Plan {
  const base = 2 + 2 + FEATURES + 2 + 1;
  const at = base / 2;
  const built = Math.floor(at - 4);
  const rebuilt = AFFECTED.filter((f) => f <= built).length;
  const items: [string, number, Kind?][] = change
    ? [["Kebutuhan", 2], ["Desain", 2], ["Bangun", at - 4], ["Ulang kebutuhan", 2, "ulang"], ["Ulang desain", 2, "ulang"],
       ["Bangun ulang", rebuilt, "ulang"], ["Bangun", FEATURES - (at - 4)], ["Uji", 2], ["Uji ulang", 1, "ulang"], ["Rilis", 1]]
    : [["Kebutuhan", 2], ["Desain", 2], ["Bangun", FEATURES], ["Uji", 2], ["Rilis", 1]];
  const segs = lay(items.filter((i) => i[1] > 0));
  const total = segs.reduce((s, x) => s + x.len, 0);
  const rework = segs.filter((s) => s.kind === "ulang").reduce((s, x) => s + x.len, 0);
  return { segs, total, changeAt: change ? at : null, firstWorking: total, rework, feedback: 1, releases: [{ at: total, features: FEATURES }] };
}

export function agile(change: boolean): Plan {
  const sprints = FEATURES / 2;
  const L = 3;
  const at = (sprints * L) / 2;
  const doneBefore = Math.floor(at / L) * 2;
  const rework = change ? AFFECTED.filter((f) => f <= doneBefore).length : 0;
  const nextSprint = Math.floor(at / L) + 2; // sprint (mulai 1) yang menyerap perubahan
  const items: [string, number, Kind?][] = [];
  for (let s = 1; s <= sprints; s++) {
    if (change && s === nextSprint && rework > 0) items.push([`Ulang fitur`, rework, "ulang"]);
    items.push([`Sprint ${s}`, L]);
  }
  const segs = lay(items);
  const releases: Plan["releases"] = [];
  let n = 0;
  segs.forEach((s) => { if (s.kind === "kerja") { n += 2; releases.push({ at: s.start + s.len, features: n }); } });
  const total = segs.reduce((s, x) => s + x.len, 0);
  return { segs, total, changeAt: change ? at : null, firstWorking: releases[0]!.at, rework, feedback: sprints, releases };
}

export const featuresAt = (p: Plan, t: number) => p.releases.reduce((n, r) => (t >= r.at ? r.features : n), 0);
export const progress = (s: Seg, t: number) => Math.max(0, Math.min(1, (t - s.start) / s.len));
