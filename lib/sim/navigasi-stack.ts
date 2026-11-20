// Navigasi sebagai mesin status: satu tumpukan layar per tab. Murni, tanpa DOM.
export type Tab = "beranda" | "kelas" | "profil";
export type Layar = { nama: "beranda" | "daftar" | "detail" | "bab" | "profil"; params?: Record<string, string> };
export type Keadaan = { aktif: Tab; tab: Record<Tab, Layar[]> };

export const TABS: readonly Tab[] = ["beranda", "kelas", "profil"];
export const SKEMA = "ruangmateri://";

export const awal = (): Keadaan => ({
  aktif: "kelas",
  tab: { beranda: [{ nama: "beranda" }], kelas: [{ nama: "daftar" }], profil: [{ nama: "profil" }] },
});

export const label = (l: Layar) =>
  l.nama === "detail" ? `kelas/${l.params!.id}` : l.nama === "bab" ? `kelas/${l.params!.id}/bab/${l.params!.bab}` : l.nama === "daftar" ? "daftar kelas" : l.nama;

export const teratas = (k: Keadaan) => k.tab[k.aktif].at(-1)!;

export const push = (k: Keadaan, l: Layar): Keadaan => ({ ...k, tab: { ...k.tab, [k.aktif]: [...k.tab[k.aktif], l] } });
export const pop = (k: Keadaan): Keadaan => (k.tab[k.aktif].length === 1 ? k : { ...k, tab: { ...k.tab, [k.aktif]: k.tab[k.aktif].slice(0, -1) } });
export const gantiTab = (k: Keadaan, t: Tab): Keadaan => ({ ...k, aktif: t });

const angka = (s: string) => /^[0-9]+$/.test(s);

// Pola rute: kelas/:id => tab kelas dengan tumpukan [daftar, detail]. Tautan dari luar tidak dipercaya.
export function deepLink(k: Keadaan, url: string): { ok: boolean; keadaan: Keadaan; pesan: string } {
  const gagal = (pesan: string) => ({ ok: false, keadaan: k, pesan });
  if (!url.startsWith(SKEMA)) return gagal(`Ditolak: tautan harus diawali ${SKEMA}`);
  const seg = url.slice(SKEMA.length).split("?")[0].split("/").filter(Boolean);
  const set = (t: Tab, tumpukan: Layar[]) => ({ ok: true, keadaan: { aktif: t, tab: { ...k.tab, [t]: tumpukan } }, pesan: "" });
  let r;
  if (seg.length === 0) r = set("beranda", [{ nama: "beranda" }]);
  else if (seg[0] === "profil" && seg.length === 1) r = set("profil", [{ nama: "profil" }]);
  else if (seg[0] === "kelas" && seg.length === 2 && angka(seg[1])) r = set("kelas", [{ nama: "daftar" }, { nama: "detail", params: { id: seg[1] } }]);
  else if (seg[0] === "kelas" && seg.length === 4 && seg[2] === "bab" && angka(seg[1]) && angka(seg[3]))
    r = set("kelas", [{ nama: "daftar" }, { nama: "detail", params: { id: seg[1] } }, { nama: "bab", params: { id: seg[1], bab: seg[3] } }]);
  else return gagal("Ditolak: rute tidak dikenal atau id bukan angka. Aplikasi tidak membuka layar apa pun.");
  const n = r.keadaan.tab[r.keadaan.aktif].length;
  return { ...r, pesan: `Dibuka: tab ${r.keadaan.aktif} dengan tumpukan ${n} layar, jadi tombol kembali masuk akal.` };
}
