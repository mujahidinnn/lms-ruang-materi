// Robot di petak: menjalankan urutan perintah di papan. Murni, tanpa DOM.
export type Arah = "atas" | "kanan" | "bawah" | "kiri";
export type Dasar = "maju" | "kiri" | "kanan";
export type Item = Dasar | { ulang: number; isi: "maju" };
export type Pose = { x: number; y: number; arah: Arah };
export type Level = { nama: string; ukuran: number; tujuan: [number, number]; batu: [number, number][]; maksItem: number; ulang: boolean; soal: string; solusi: Item[] };

const URUTAN: Arah[] = ["atas", "kanan", "bawah", "kiri"];
const GESER: Record<Arah, [number, number]> = { atas: [0, 1], kanan: [1, 0], bawah: [0, -1], kiri: [-1, 0] };
export const MULAI: Pose = { x: 0, y: 0, arah: "atas" };

export const LEVELS: Level[] = [
  { nama: "Level 1", ukuran: 5, tujuan: [4, 4], batu: [[1, 1], [2, 3], [4, 2]], maksItem: 12, ulang: false, soal: "Antar robot ke bintang dengan perintah dasar.", solusi: ["maju", "maju", "kanan", "maju", "maju", "maju", "kiri", "maju", "maju", "kanan", "maju"] },
  { nama: "Level 2", ukuran: 5, tujuan: [4, 0], batu: [[2, 0], [1, 3], [3, 1]], maksItem: 12, ulang: false, soal: "Bintang ada di pojok kanan bawah. Lantai bawah terhalang batu.", solusi: ["maju", "maju", "kanan", "maju", "maju", "maju", "maju", "kanan", "maju", "maju"] },
  { nama: "Level 3", ukuran: 5, tujuan: [4, 4], batu: [[1, 1], [2, 2], [3, 3]], maksItem: 4, ulang: true, soal: "Pakai ULANGI: program paling banyak 4 baris.", solusi: [{ ulang: 4, isi: "maju" }, "kanan", { ulang: 4, isi: "maju" }] },
];

export const ulangi = (p: Item[]): Dasar[] => p.flatMap((i) => (typeof i === "string" ? [i] : Array<Dasar>(i.ulang).fill(i.isi)));
export const namaItem = (i: Item) => (typeof i === "string" ? { maju: "maju", kiri: "belok kiri", kanan: "belok kanan" }[i] : `ulangi ${i.ulang}x maju`);

export type Hasil = "sukses" | "tabrak" | "keluar" | "belum";
export function jalankan(l: Level, p: Item[]): { jejak: Pose[]; hasil: Hasil; langkah: number } {
  let s = { ...MULAI };
  const jejak = [s];
  let hasil: Hasil = "belum";
  const cmds = ulangi(p);
  for (const c of cmds) {
    if (c === "maju") {
      const [dx, dy] = GESER[s.arah];
      const n = { ...s, x: s.x + dx, y: s.y + dy };
      if (n.x < 0 || n.y < 0 || n.x >= l.ukuran || n.y >= l.ukuran) { hasil = "keluar"; break; }
      if (l.batu.some(([bx, by]) => bx === n.x && by === n.y)) { hasil = "tabrak"; break; }
      s = n;
    } else {
      s = { ...s, arah: URUTAN[(URUTAN.indexOf(s.arah) + (c === "kanan" ? 1 : 3)) % 4] };
    }
    jejak.push(s);
  }
  if (hasil === "belum" && s.x === l.tujuan[0] && s.y === l.tujuan[1]) hasil = "sukses";
  return { jejak, hasil, langkah: jejak.length - 1 };
}

export function pesan(hasil: Hasil, langkah: number, pose: Pose): string {
  if (hasil === "sukses") return `Sukses: robot sampai di bintang dalam ${langkah} langkah.`;
  if (hasil === "tabrak") return `Tabrak: robot menabrak batu setelah ${langkah} langkah. Cari perintah yang salah, lalu perbaiki (debugging).`;
  if (hasil === "keluar") return `Keluar petak: robot melewati tepi papan setelah ${langkah} langkah.`;
  return `Perintah habis di (${pose.x}, ${pose.y}) menghadap ${pose.arah}, belum sampai di bintang.`;
}
