export type Kelas = { nama: string; induk: string | null; suara: string | null };

// suara null = tidak menimpa bersuara(), memakai milik induk.
export const KELAS: Kelas[] = [
  { nama: "Hewan", induk: null, suara: "..." },
  { nama: "Kucing", induk: "Hewan", suara: "Meong" },
  { nama: "Anjing", induk: "Hewan", suara: "Guk" },
  { nama: "Bebek", induk: "Hewan", suara: "Kwek" },
  { nama: "Ikan", induk: "Hewan", suara: null },
];

export const DAFTAR = ["Kucing", "Ikan", "Bebek", "Anjing"];

export type Lookup = { rantai: string[]; ditemukan: string; suara: string; override: boolean };

// Method resolution: naik dari class objek ke induknya sampai ada bersuara().
export function cari(nama: string, kelas: Kelas[] = KELAS): Lookup {
  const rantai: string[] = [];
  let k: Kelas | undefined = kelas.find((c) => c.nama === nama);
  if (!k) throw new Error(`kelas ${nama} tidak ada`);
  const asal = k.nama;
  while (k) {
    rantai.push(k.nama);
    if (k.suara !== null) return { rantai, ditemukan: k.nama, suara: k.suara, override: k.nama === asal };
    k = kelas.find((c) => c.nama === k!.induk);
  }
  throw new Error(`bersuara() tidak ditemukan untuk ${nama}`);
}

export type Event = { obj: string; k: number; selesai: boolean; hasil: string[]; lk: Lookup };

// Satu event per class yang diperiksa, lalu satu event hasil. Daftar > 1 objek = perulangan for.
export function events(daftar: string[]): Event[] {
  const out: Event[] = [];
  const hasil: string[] = [];
  for (const obj of daftar) {
    const lk = cari(obj);
    for (let k = 1; k <= lk.rantai.length; k++) out.push({ obj, k, selesai: false, hasil: [...hasil], lk });
    hasil.push(lk.suara);
    out.push({ obj, k: lk.rantai.length, selesai: true, hasil: [...hasil], lk });
  }
  return out;
}
