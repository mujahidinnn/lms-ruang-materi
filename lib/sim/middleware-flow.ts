// Rantai middleware Express: request berhenti di mana, dan status akhirnya. Murni, tanpa DOM.
export type Token = "benar" | "salah" | "tak ada";
export type Isi = "valid" | "tidak valid";
export type Db = "normal" | "gagal";
export type Skenario = { token: Token; isi: Isi; db: Db };
export type Nama = "logger" | "auth" | "validasi" | "handler" | "error handler";
export type Hasil = "next" | "respons" | "error" | "tak tercapai";
export type Langkah = { nama: Nama; hasil: Hasil; ket: string };

export const urutan = (tukar: boolean): Nama[] =>
  tukar ? ["logger", "validasi", "auth", "handler", "error handler"] : ["logger", "auth", "validasi", "handler", "error handler"];

export const permintaan = (s: Skenario): string[] => [
  "POST /kelas",
  s.token === "tak ada" ? "(tanpa header Authorization)" : `Authorization: Bearer ${s.token === "benar" ? "eyJhbGci..." : "abc.palsu"}`,
  s.isi === "valid" ? '{ "judul": "Express" }' : "{ }",
];

export function jalankan(tukar: boolean, s: Skenario) {
  const langkah: Langkah[] = [];
  let selesai = false;
  let err = false;
  let status = 0;
  let isi = "";
  const stop = (nama: Nama, kode: number, pesan: string, ket: string) => {
    langkah.push({ nama, hasil: "respons", ket });
    selesai = true; status = kode; isi = pesan;
  };
  for (const nama of urutan(tukar)) {
    if (nama === "error handler") {
      if (err) stop(nama, 500, '{ "pesan": "server bermasalah" }', "menerima error dan membalas 500");
      else langkah.push({ nama, hasil: "tak tercapai", ket: "tidak ada error, tidak dipakai" });
    } else if (selesai) {
      langkah.push({ nama, hasil: "tak tercapai", ket: "tidak dijalankan" });
    } else if (nama === "logger") {
      langkah.push({ nama, hasil: "next", ket: "mencatat request, lalu next()" });
    } else if (nama === "auth") {
      if (s.token === "benar") langkah.push({ nama, hasil: "next", ket: "token sah, lalu next()" });
      else stop(nama, 401, `{ "pesan": "${s.token === "salah" ? "token tidak valid" : "token tidak ada"}" }`, "token ditolak, balas 401");
    } else if (nama === "validasi") {
      if (s.isi === "valid") langkah.push({ nama, hasil: "next", ket: "body lengkap, lalu next()" });
      else stop(nama, 422, '{ "pesan": "judul wajib diisi" }', "body ditolak, balas 422");
    } else if (s.db === "gagal") {
      langkah.push({ nama, hasil: "error", ket: "database gagal, next(err)" });
      err = true;
    } else {
      stop(nama, 200, '{ "pesan": "kelas dibuat", "id": 7 }', "simpan data, balas 200");
    }
  }
  return { langkah, status, isi, log: `POST /kelas ${status}` };
}

export function catatan(tukar: boolean, s: Skenario): string {
  const r = jalankan(tukar, s);
  const henti = r.langkah.find((l) => l.hasil === "respons")!;
  const ke = r.langkah.indexOf(henti) + 1;
  const lanjut = r.langkah.slice(ke).filter((l) => l.hasil === "tak tercapai").length;
  let t =
    r.status === 200 ? "Semua middleware memanggil next(), sampai handler membalas 200."
    : r.status === 500 ? "Handler memanggil next(err), jadi Express melompat ke error handler dan membalas 500."
    : `${henti.nama} membalas ${r.status} di langkah ${ke}, jadi ${lanjut} middleware sesudahnya tidak dijalankan.`;
  if (tukar && s.token !== "benar" && s.isi === "tidak valid") t += " Karena validasi di depan auth, orang tanpa izin tetap dijawab 422, bukan 401.";
  return t;
}
