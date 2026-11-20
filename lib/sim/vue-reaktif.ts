// ref -> computed -> tampilan: hitung ulang vs cache, dan DOM manual. Murni, tanpa DOM.
export type RefKey = "harga" | "jumlah" | "diskon";
export type Refs = Record<RefKey, number>;
export type Hitung = "subtotal" | "total";
export type Node = { nilai: number; kotor: boolean; hitung: number; cache: number };
export type Reaktif = { refs: Refs; subtotal: Node; total: Node; render: number; ulang: Hitung[]; dariCache: Hitung[] };

// computed -> yang dibacanya (ref atau computed lain)
export const DEP: Record<Hitung, (RefKey | Hitung)[]> = { subtotal: ["harga", "jumlah"], total: ["subtotal", "diskon"] };
export const subtotalDari = (r: Refs) => r.harga * r.jumlah;
export const totalDari = (r: Refs) => Math.round((subtotalDari(r) * (100 - r.diskon)) / 100);

export const KODE = `const harga = ref(25000)
const jumlah = ref(2)
const diskon = ref(10)
const subtotal = computed(() => harga.value * jumlah.value)
const total = computed(() => subtotal.value * (100 - diskon.value) / 100)`;

function baca(s: Reaktif, k: Hitung, log: { ulang: Hitung[]; cache: Hitung[] }): number {
  const n = s[k];
  if (n.kotor) {
    DEP[k].forEach((d) => d === "subtotal" && baca(s, "subtotal", log));
    n.nilai = k === "subtotal" ? subtotalDari(s.refs) : Math.round((s.subtotal.nilai * (100 - s.refs.diskon)) / 100);
    n.kotor = false; n.hitung++; log.ulang.push(k);
  } else { n.cache++; log.cache.push(k); }
  return n.nilai;
}

// render = template membaca subtotal dan total.
function render(s: Reaktif): Reaktif {
  const log = { ulang: [] as Hitung[], cache: [] as Hitung[] };
  baca(s, "subtotal", log); baca(s, "total", log);
  return { ...s, render: s.render + 1, ulang: [...new Set(log.ulang)], dariCache: [...new Set(log.cache)].filter((k) => !log.ulang.includes(k)) };
}

export const buat = (refs: Refs): Reaktif =>
  render({ refs, subtotal: { nilai: 0, kotor: true, hitung: 0, cache: 0 }, total: { nilai: 0, kotor: true, hitung: 0, cache: 0 }, render: 0, ulang: [], dariCache: [] });

const salin = (s: Reaktif): Reaktif => ({ ...s, subtotal: { ...s.subtotal }, total: { ...s.total } });

export function ubah(s: Reaktif, key: RefKey, nilai: number): Reaktif {
  if (nilai === s.refs[key]) return { ...s, ulang: [], dariCache: [] }; // nilai sama: tidak memicu apa pun
  const n = salin({ ...s, refs: { ...s.refs, [key]: nilai } });
  const kotor = (k: Hitung): boolean => DEP[k].some((d) => d === key || (d === "subtotal" && kotor("subtotal")));
  (["subtotal", "total"] as const).forEach((k) => { if (kotor(k)) n[k].kotor = true; });
  return render(n);
}
export const bacaUlang = (s: Reaktif): Reaktif => render(salin(s));

// Tanpa reaktivitas: layar hanya berubah bila kita memanggil perbarui sendiri.
export type Manual = { refs: Refs; tampil: { subtotal: number; total: number }; panggilan: number };
export const buatManual = (refs: Refs): Manual => ({ refs, tampil: { subtotal: subtotalDari(refs), total: totalDari(refs) }, panggilan: 0 });
export const ubahManual = (m: Manual, key: RefKey, nilai: number): Manual => ({ ...m, refs: { ...m.refs, [key]: nilai } });
export const perbarui = (m: Manual): Manual => ({ ...m, tampil: { subtotal: subtotalDari(m.refs), total: totalDari(m.refs) }, panggilan: m.panggilan + 1 });
export const basi = (m: Manual): Hitung[] => (["subtotal", "total"] as const).filter((k) => m.tampil[k] !== (k === "subtotal" ? subtotalDari(m.refs) : totalDari(m.refs)));
