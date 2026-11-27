// Diagrams for Studio Proyek "catatan-keuangan-mobile", embedded as ![ket](/studio/catatan-keuangan-mobile/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/catatan-keuangan-mobile.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const INK = "#0f100d", M1 = "#e3edc8", M3 = "#b5d36f";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const frame = (title, height, body, defs = "") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 ${height}" width="1200" height="${height}" role="img" aria-labelledby="t" font-family="system-ui, 'Segoe UI', Roboto, sans-serif">
<title id="t">${esc(title)}</title>
<defs>${defs}</defs>
<rect width="1200" height="${height}" fill="#ffffff"/>
${body}
</svg>
`;
const text = (x, y, s, { size = 28, weight = 600, anchor = "start", fill = INK, mono = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}"${mono ? ' font-family="ui-monospace, Menlo, Consolas, monospace"' : ""}>${esc(s)}</text>`;
const box = (x, y, w, h, { fill = "#ffffff", r = 14, sw = 4, dash } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
const line = (x1, y1, x2, y2, { sw = 4, stroke = INK, dash } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
const AH = '<marker id="ah" markerWidth="14" markerHeight="14" refX="11" refY="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L14 7L0 14z" fill="#0f100d"/></marker>';
const arrow = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="5" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""} marker-end="url(#ah)"/>`;
const S = (o = {}) => ({ size: 22, weight: 500, ...o });
const note = (y, s, w = 500) => text(600, y, s, { size: 24, anchor: "middle", weight: w });
const bar = (x, y, w, h = 14) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${INK}" opacity="0.18"/>`;
const PINK = "#f4b6c2";
const mono = (x, y, s, o = {}) => text(x, y, s, { size: 19, weight: 600, mono: true, ...o });

// Three phone screens with sample (fake) data.
function tigaLayar() {
  let b = text(600, 58, "Tiga layar Uangku", { size: 40, weight: 800, anchor: "middle" });
  const W = 320, H = 600, Y = 130;
  const phone = (x, judul, alamat) => text(x + W / 2, 108, `${judul}  ${alamat}`, S({ size: 20, weight: 800, anchor: "middle" })) + box(x, Y, W, H, { r: 34 }) + `<rect x="${x + 120}" y="${Y + 14}" width="80" height="10" rx="5" fill="${INK}" opacity="0.25"/>`;
  const seg = (x, y, a, c) => box(x, y, 268, 44, { r: 22, sw: 3 }) + `<rect x="${x + (a ? 4 : 136)}" y="${y + 4}" width="128" height="36" rx="18" fill="${M3}"/>` + text(x + 68, y + 29, "Keluar", { size: 18, weight: 800, anchor: "middle" }) + text(x + 200, y + 29, "Masuk", { size: 18, weight: c ? 800 : 600, anchor: "middle" });
  // Beranda
  let x = 50, p = x + 26;
  b += phone(x, "Beranda", "/");
  b += text(x + W / 2, Y + 70, "‹   November 2026   ›", { size: 20, weight: 800, anchor: "middle" });
  b += box(p, Y + 90, 268, 110, { fill: M1, r: 16, sw: 3 }) + text(p + 16, Y + 120, "Saldo sampai akhir bulan", S({ size: 15 })) + text(p + 16, Y + 156, "Rp 1.250.000", { size: 28, weight: 800 }) + text(p + 16, Y + 186, "Masuk 2.500.000  Keluar 830.000", S({ size: 14, weight: 700 }));
  b += text(p, Y + 232, "Lihat per kategori ›", { size: 16, weight: 800 });
  const hari = [["Kamis, 26 November", [["Makan", "-15.000"], ["Transport", "-12.000"]]], ["Rabu, 25 November", [["Gaji", "+2.500.000"], ["Belanja", "-120.000"]]]];
  let yy = Y + 274;
  for (const [h, rows] of hari) {
    b += text(p, yy, h, { size: 15, weight: 800, fill: "#55594d" }); yy += 12;
    for (const [k, v] of rows) { b += line(p, yy, p + 268, yy, { sw: 1, stroke: "#c9cbc3" }) + text(p, yy + 30, k, S({ size: 18 })) + text(p + 268, yy + 30, v, { size: 18, weight: 800, anchor: "end" }); yy += 44; }
    yy += 28;
  }
  b += `<circle cx="${x + W - 50}" cy="${Y + H - 50}" r="30" fill="${M3}" stroke="${INK}" stroke-width="4"/>` + text(x + W - 50, Y + H - 39, "+", { size: 34, weight: 800, anchor: "middle" });
  // Catat
  x = 440; p = x + 26;
  b += phone(x, "Catat", "/tambah");
  b += seg(p, Y + 50, true, false);
  const field = (y, label, isi, err) => text(p, y, label, { size: 16, weight: 800 }) + box(p, y + 10, 268, 42, { r: 10, sw: 3, fill: err ? "#fff4f6" : "#ffffff" }) + text(p + 12, y + 38, isi, S({ size: 17, fill: isi.startsWith("TTTT") ? "#6b6f63" : INK })) + (err ? text(p, y + 74, err, { size: 14, weight: 700, fill: "#b4233c" }) : "");
  b += field(Y + 130, "Jumlah", "", "Isi jumlahnya.");
  b += text(p, Y + 240, "Kategori", { size: 16, weight: 800 });
  [["Makan", 0, 0], ["Transport", 1, 0], ["Belanja", 0, 1], ["Tagihan", 1, 1]].forEach(([k, c, r]) => { b += box(p + c * 138, Y + 252 + r * 46, 128, 38, { r: 19, sw: 3 }) + text(p + c * 138 + 64, Y + 277 + r * 46, k, S({ size: 16, anchor: "middle", weight: 700 })); });
  b += field(Y + 370, "Tanggal", "2026-11-26");
  b += field(Y + 450, "Catatan", "boleh kosong");
  b += box(p, Y + 530, 268, 48, { fill: M3, r: 24 }) + text(p + 134, Y + 561, "Simpan", { size: 20, weight: 800, anchor: "middle" });
  // Ringkasan
  x = 830; p = x + 26;
  b += phone(x, "Ringkasan", "/ringkasan");
  b += seg(p, Y + 50, true, false);
  b += text(p, Y + 140, "Total pengeluaran", S({ size: 16 })) + text(p, Y + 176, "Rp 830.000", { size: 28, weight: 800 });
  [["Makan", 45], ["Transport", 20], ["Belanja", 18], ["Tagihan", 12], ["Lainnya", 5]].forEach(([k, pct], i) => {
    const y = Y + 220 + i * 66;
    b += text(p, y, k, S({ size: 17, weight: 700 })) + text(p + 268, y, pct + "%", { size: 17, weight: 800, anchor: "end" });
    b += `<rect x="${p}" y="${y + 12}" width="268" height="16" rx="8" fill="${M1}"/><rect x="${p}" y="${y + 12}" width="${268 * pct / 100}" height="16" rx="8" fill="${M3}" stroke="${INK}" stroke-width="2"/>`;
  });
  b += note(780, "Data contoh. Tombol + membuka Catat, Simpan kembali ke Beranda,") + note(812, "dan tiap batang dibuat dari dua View dengan flex.");
  return frame("Rancangan tiga layar Uangku: Beranda dengan saldo dan daftar per hari, Catat dengan form dan pesan galat, Ringkasan dengan batang persentase per kategori", 840, b, AH);
}

// From typed text to a row in SQLite and back to the home screen.
function alurSimpan() {
  let b = text(600, 58, "Alur tombol Simpan", { size: 40, weight: 800, anchor: "middle" });
  const n = (x, y, w, h, t, sub, f = "#ffffff") => box(x, y, w, h, { fill: f, r: 18 }) + text(x + w / 2, y + 40, t, { size: 22, weight: 800, anchor: "middle" }) + sub.map((l, i) => mono(x + w / 2, y + 74 + i * 26, l, { anchor: "middle", size: 16 })).join("");
  b += n(40, 110, 330, 140, "Isi form (semua teks)", ['jumlah: "15000"', 'kategori: "Makan"', 'tanggal: "2026-11-26"']);
  b += n(450, 110, 300, 140, "validasi(form)", ["uang.ts, tanpa layar", "diuji node --test"], M1);
  b += arrow(372, 180, 444, 180);
  b += n(830, 110, 330, 140, "{ ok: false, galat }", ['jumlah: "Isi jumlahnya."', "teks merah di bawah", "kolom yang salah"], PINK);
  b += arrow(752, 160, 824, 160) + text(788, 148, "salah", S({ size: 16, anchor: "middle", weight: 700 }));
  b += `<path d="M995 252 C 995 300, 205 300, 205 256" fill="none" stroke="${INK}" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" marker-end="url(#ah)"/>`;
  b += text(330, 330, "pemakai memperbaiki,", S({ size: 18, anchor: "middle", weight: 700 })) + text(330, 354, "lalu tekan Simpan lagi", S({ size: 18, anchor: "middle", weight: 700 }));
  b += arrow(600, 252, 600, 366) + text(616, 350, "{ ok: true, data }", { size: 17, weight: 700, mono: true });
  b += n(300, 372, 600, 150, "tambahTransaksi(db, data)", ["INSERT INTO transaksi (jenis, jumlah, ...)", "VALUES (?, ?, ?, ?, ?)", "nilai dikirim terpisah dari teks SQL"], M3);
  b += box(40, 390, 200, 110, { r: 18, dash: "10 8", sw: 3 }) + text(140, 432, "menyimpan", { size: 19, weight: 800, anchor: "middle", mono: true }) + text(140, 466, "tombol dikunci,", S({ size: 17, anchor: "middle" })) + text(140, 490, "tak ada data ganda", S({ size: 17, anchor: "middle" }));
  b += line(242, 446, 296, 446, { sw: 3, dash: "6 8" });
  b += n(960, 390, 200, 110, "uangku.db", ["berkas SQLite", "di HP"]);
  b += arrow(902, 446, 954, 446);
  b += arrow(600, 524, 600, 576) + mono(616, 556, "router.back()", { size: 17, weight: 700 });
  b += n(300, 582, 600, 120, "Beranda tampil lagi", ["useFocusEffect → muat() ulang", "daftar, total, dan saldo ikut berubah"], M1);
  b += note(752, "Gagal menyimpan (misalnya database error) tidak diam: Alert menampilkan pesannya.");
  return frame("Alur Simpan: isi form divalidasi; galat kembali ke form, data valid disimpan dengan query berparameter ke SQLite, lalu router.back dan beranda memuat ulang", 780, b, AH);
}

// Month total vs balance: balance carries everything before.
function saldoBulan() {
  let b = text(600, 58, "Total bulan vs saldo", { size: 40, weight: 800, anchor: "middle" });
  const months = [["September", "+2.000.000", "-2.320.000"], ["Oktober", "+2.000.000", "-2.100.000"], ["November", "+2.500.000", "-830.000"]];
  months.forEach(([m, i, o], k) => {
    const x = 60 + k * 370;
    b += box(x, 120, 340, 150, { fill: k === 2 ? M3 : M1, r: 18 }) + text(x + 170, 162, m + " 2026", { size: 24, weight: 800, anchor: "middle" });
    b += text(x + 30, 204, "Masuk", S({ size: 19 })) + text(x + 310, 204, i, { size: 19, weight: 800, anchor: "end" }) + text(x + 30, 240, "Keluar", S({ size: 19 })) + text(x + 310, 240, o, { size: 19, weight: 800, anchor: "end" });
  });
  // total bracket
  b += line(800, 290, 800, 310, { sw: 3 }) + line(800, 310, 1110, 310, { sw: 3 }) + line(1110, 290, 1110, 310, { sw: 3 });
  b += text(955, 344, "Total bulan ini", { size: 22, weight: 800, anchor: "middle" }) + text(955, 374, "dihitung di JavaScript", S({ size: 18, anchor: "middle" })) + text(955, 402, "dari daftar yang sudah diambil", S({ size: 18, anchor: "middle" }));
  b += mono(955, 436, "BETWEEN '2026-11-01' AND '2026-11-31'", { size: 15, anchor: "middle" });
  // saldo bracket
  b += line(60, 470, 60, 490, { sw: 3 }) + line(60, 490, 1110, 490, { sw: 3 }) + line(1110, 470, 1110, 490, { sw: 3 });
  b += box(160, 520, 880, 150, { r: 18 }) + text(600, 562, "Saldo sampai akhir November = Rp 1.250.000", { size: 24, weight: 800, anchor: "middle" });
  b += mono(600, 600, "SELECT COALESCE(SUM(CASE WHEN jenis = 'masuk'", { size: 17, anchor: "middle" }) + mono(600, 626, "THEN jumlah ELSE -jumlah END), 0) FROM transaksi", { size: 17, anchor: "middle" }) + mono(600, 652, "WHERE tanggal <= '2026-11-31'", { size: 17, anchor: "middle", weight: 800 });
  b += note(714, "Saldo memakai semua transaksi sebelumnya: minus 420.000 dari September dan Oktober ikut terbawa.");
  return frame("Total bulan hanya menjumlahkan November, sedangkan saldo menjumlahkan semua transaksi sampai akhir November di SQL", 740, b, AH);
}

const DIAGRAMS = { "tiga-layar": tigaLayar, "alur-simpan": alurSimpan, "saldo-bulan": saldoBulan };
mkdirSync("public/studio/catatan-keuangan-mobile", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/catatan-keuangan-mobile/${name}.svg`, draw());
  console.log(name);
}
