// Diagrams for Studio Proyek "studi-kasus-desain-aplikasi", embedded as ![ket](/studio/studi-kasus-desain-aplikasi/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/studi-kasus-desain-aplikasi.mjs
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
const PINK = "#f4b6c2", GREY = "#e4e5e1", GREY2 = "#c9cbc3";
const mono = (x, y, s, o = {}) => text(x, y, s, { size: 19, weight: 600, mono: true, ...o });
// Example app throughout: antrean puskesmas (the running example in the steps).

function userFlow() {
  let b = text(600, 58, "Contoh user flow: ambil nomor antrean", { size: 40, weight: 800, anchor: "middle" });
  const pill = (x, y, w, t, f = INK) => `<rect x="${x}" y="${y}" width="${w}" height="56" rx="28" fill="${f}"/>` + text(x + w / 2, y + 36, t, { size: 20, weight: 800, anchor: "middle", fill: "#ffffff" });
  const scr = (x, y, t, sub) => box(x, y, 200, 96, { fill: M1, r: 12 }) + text(x + 100, y + 40, t, { size: 20, weight: 800, anchor: "middle" }) + text(x + 100, y + 70, sub, S({ size: 16, anchor: "middle" }));
  const dia = (cx, cy, t1, t2) => `<polygon points="${cx},${cy - 70} ${cx + 110},${cy} ${cx},${cy + 70} ${cx - 110},${cy}" fill="#ffffff" stroke="${INK}" stroke-width="4"/>` + text(cx, cy - 4, t1, { size: 18, weight: 800, anchor: "middle" }) + text(cx, cy + 20, t2, { size: 18, weight: 800, anchor: "middle" });
  const Y = 130;
  b += pill(40, Y + 20, 130, "Mulai");
  b += text(105, Y + 100, "buka aplikasi", S({ size: 16, anchor: "middle" }));
  b += arrow(172, Y + 48, 214, Y + 48);
  b += scr(220, Y, "Beranda", "puskesmas terdekat");
  b += arrow(422, Y + 48, 464, Y + 48);
  b += scr(470, Y, "Pilih poli", "Umum, Gigi, KIA");
  b += arrow(672, Y + 48, 714, Y + 48);
  b += scr(720, Y, "Pilih hari", "besok / lusa");
  b += arrow(820, Y + 98, 820, Y + 150);
  b += dia(820, Y + 222, "Kuota", "masih ada?");
  b += arrow(932, Y + 222, 974, Y + 222) + text(953, Y + 208, "ya", S({ size: 18, weight: 800, anchor: "middle" }));
  b += scr(980, Y + 174, "Konfirmasi", "data pasien");
  b += arrow(1080, Y + 272, 1080, Y + 326);
  b += scr(980, Y + 332, "Nomor kamu", "A-012, ± 09.40");
  b += arrow(1080, Y + 430, 1080, Y + 476);
  b += pill(1000, Y + 482, 160, "Selesai");
  // alternative path
  b += arrow(708, Y + 222, 560, Y + 222) + text(640, Y + 208, "tidak", S({ size: 18, weight: 800, anchor: "middle" }));
  b += box(330, Y + 170, 222, 104, { fill: PINK, r: 12, dash: "10 8", sw: 3 }) + text(441, Y + 212, "Antrean penuh", { size: 20, weight: 800, anchor: "middle" }) + text(441, Y + 244, "sarankan hari lain", S({ size: 16, anchor: "middle" }));
  b += `<path d="M441 ${Y + 168} C 441 ${Y + 120}, 640 ${Y + 140}, 716 ${Y + 90}" fill="none" stroke="${INK}" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" marker-end="url(#ah)"/>`;
  b += text(180, Y + 152, "kembali ke Pilih hari", S({ size: 17, weight: 700 }));
  // legend
  const ly = Y + 570;
  b += `<rect x="60" y="${ly}" width="60" height="30" rx="15" fill="${INK}"/>` + text(132, ly + 22, "mulai / selesai", S({ size: 17 }));
  b += box(320, ly, 60, 30, { fill: M1, r: 8, sw: 3 }) + text(392, ly + 22, "layar", S({ size: 17 }));
  b += `<polygon points="${520},${ly - 4} ${552},${ly + 15} ${520},${ly + 34} ${488},${ly + 15}" fill="#ffffff" stroke="${INK}" stroke-width="3"/>` + text(566, ly + 22, "keputusan", S({ size: 17 }));
  b += box(700, ly, 60, 30, { fill: PINK, r: 8, sw: 3, dash: "6 6" }) + text(772, ly + 22, "jalur alternatif", S({ size: 17 }));
  b += note(ly + 90, "Lima layar utama dari Mulai sampai Selesai; jalur penuh kembali ke Pilih hari, bukan ke awal.");
  return frame("Contoh user flow antrean puskesmas: Beranda, Pilih poli, Pilih hari, keputusan kuota, Konfirmasi, Nomor kamu; jalur alternatif antrean penuh kembali ke Pilih hari", ly + 120, b, AH);
}

function wireframe() {
  let b = text(600, 58, "Contoh wireframe low-fi: abu-abu, teks sungguhan", { size: 38, weight: 800, anchor: "middle" });
  const W = 300, H = 560, Y = 110;
  const ph = (x, t) => box(x, Y, W, H, { r: 30 }) + text(x + 24, Y + 60, "‹", { size: 28, weight: 800 }) + text(x + W / 2, Y + 60, t, { size: 21, weight: 800, anchor: "middle" }) + line(x, Y + 84, x + W, Y + 84, { sw: 2 });
  const thumb = (x) => `<rect x="${x + 8}" y="${Y + H - 170}" width="${W - 16}" height="160" rx="22" fill="${M1}"/>`;
  const btn = (x, y, t, primary = true) => `<rect x="${x + 24}" y="${y}" width="${W - 48}" height="54" rx="10" fill="${primary ? "#5f6159" : "#ffffff"}" stroke="${INK}" stroke-width="3"/>` + text(x + W / 2, y + 35, t, { size: 19, weight: 800, anchor: "middle", fill: primary ? "#ffffff" : INK });
  const grey = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${GREY}" stroke="${GREY2}" stroke-width="2"/>`;
  // 1 pilih poli
  let x = 60;
  b += ph(x, "Pilih poli") + thumb(x);
  b += text(x + 24, Y + 124, "Puskesmas Sukajadi", { size: 18, weight: 800 }) + text(x + 24, Y + 150, "buka 07.30-14.00", S({ size: 16 }));
  [["Poli Umum", "sisa 14 kuota"], ["Poli Gigi", "sisa 3 kuota"], ["KIA", "penuh hari ini"]].forEach(([t, s], i) => {
    const y = Y + 176 + i * 84;
    b += grey(x + 24, y, W - 48, 70) + text(x + 40, y + 30, t, { size: 18, weight: 800 }) + text(x + 40, y + 56, s, S({ size: 16 }));
  });
  b += btn(x, Y + H - 90, "Lanjut");
  // 2 konfirmasi
  x = 450;
  b += ph(x, "Konfirmasi") + thumb(x);
  [["Poli", "Gigi"], ["Hari", "Kamis, 3 Des"], ["Pasien", "Rina Wulandari"], ["No. BPJS", "0001234567890"]].forEach(([k, v], i) => {
    const y = Y + 128 + i * 66;
    b += text(x + 24, y, k, S({ size: 16 })) + text(x + 24, y + 28, v, { size: 19, weight: 800 }) + line(x + 24, y + 44, x + W - 24, y + 44, { sw: 1, stroke: GREY2 });
  });
  b += btn(x, Y + H - 150, "Ubah data", false) + btn(x, Y + H - 84, "Ambil nomor");
  // 3 nomor
  x = 840;
  b += ph(x, "Nomor kamu") + thumb(x);
  b += grey(x + 24, Y + 110, W - 48, 160) + text(x + W / 2, Y + 150, "Poli Gigi", S({ size: 18, anchor: "middle" })) + text(x + W / 2, Y + 214, "A-012", { size: 52, weight: 800, anchor: "middle" }) + text(x + W / 2, Y + 252, "sekarang dipanggil: A-004", S({ size: 16, anchor: "middle" }));
  b += text(x + 24, Y + 316, "Perkiraan dipanggil", S({ size: 16 })) + text(x + 24, Y + 346, "± 09.40", { size: 24, weight: 800 }) + text(x + 24, Y + 376, "berangkat paling lambat 09.10", S({ size: 16 }));
  b += btn(x, Y + H - 150, "Batalkan", false) + btn(x, Y + H - 84, "Ingatkan aku");
  // labels
  b += `<rect x="60" y="${Y + H + 34}" width="40" height="24" fill="${M1}"/>` + text(112, Y + H + 53, "area jempol: aksi utama di sini", S({ size: 18 }));
  b += note(Y + H + 100, "Belum ada warna, ikon, atau foto. Tombol abu tua = aksi utama, satu per layar.");
  return frame("Contoh wireframe low-fi tiga layar antrean puskesmas: Pilih poli, Konfirmasi, Nomor kamu; aksi utama di area jempol bagian bawah", Y + H + 130, b, AH);
}

function designSystem() {
  let b = text(600, 58, "Contoh fondasi design system", { size: 40, weight: 800, anchor: "middle" });
  b += text(60, 116, "Warna (variables)", { size: 24, weight: 800 });
  const sw = [
    ["warna/utama", "#1f6f5c", "#ffffff", "6.0:1"], ["warna/aksen", "#f2b134", "#1b1f1d", "8.8:1"], ["warna/teks", "#1b1f1d", "#ffffff", "16.7:1"], ["warna/teks-lemah", "#5b6662", "#ffffff", "6.0:1"],
    ["status/sukses", "#1e7b3a", "#ffffff", "5.3:1"], ["status/peringatan", "#a15c00", "#ffffff", "5.2:1"], ["status/bahaya", "#c0392b", "#ffffff", "5.4:1"], ["warna/garis", "#d5dbd8", "#1b1f1d", "dekorasi"],
  ];
  sw.forEach(([n, hex, fg, ratio], i) => {
    const x = 60 + (i % 4) * 275, y = 136 + Math.floor(i / 4) * 150;
    b += `<rect x="${x}" y="${y}" width="255" height="80" rx="12" fill="${hex}" stroke="${INK}" stroke-width="3"/>` + text(x + 16, y + 50, "Aa  " + ratio, { size: 22, weight: 800, fill: fg });
    b += mono(x, y + 106, n, { size: 16, weight: 700 }) + mono(x, y + 128, hex, { size: 15, weight: 500 });
  });
  b += box(60, 446, 520, 60, { fill: PINK, r: 12, sw: 3 }) + text(80, 484, "Putih di atas aksen hanya 1.9:1 → pakai teks gelap", S({ size: 18, weight: 700 }));
  // type scale
  b += text(60, 566, "Skala huruf (text styles)", { size: 24, weight: 800 });
  [["judul/besar", 28, 800], ["judul/sedang", 22, 800], ["isi", 16, 500], ["isi/kecil", 14, 500]].forEach(([n, sz, w], i) => {
    const y = 616 + i * 50;
    b += mono(60, y, n, { size: 16, weight: 700 }) + text(240, y, `${sz} px  Nomor antrean A-012`, { size: sz, weight: w });
  });
  // spacing
  b += text(700, 566, "Jarak (kelipatan 4)", { size: 24, weight: 800 });
  [4, 8, 12, 16, 24, 32].forEach((v, i) => {
    const y = 594 + i * 34;
    b += mono(700, y + 20, `jarak/${v}`, { size: 16, weight: 700 }) + `<rect x="820" y="${y + 4}" width="${v * 8}" height="22" rx="4" fill="${M3}" stroke="${INK}" stroke-width="2"/>` + text(830 + v * 8, y + 21, `${v} px`, S({ size: 15 }));
  });
  b += note(830, "Angka di tiap warna adalah rasio kontras teks Aa di atasnya; teks biasa butuh minimal 4.5:1.");
  return frame("Contoh fondasi design system: delapan variables warna dengan rasio kontrasnya, skala huruf 28 sampai 14 px, dan skala jarak kelipatan 4", 860, b, AH);
}

function komponen() {
  let b = text(600, 58, "Komponen Tombol: variant dan auto layout", { size: 40, weight: 800, anchor: "middle" });
  // anatomy
  b += text(60, 120, "Auto layout (Hug contents)", { size: 24, weight: 800 });
  const ax = 120, ay = 180;
  b += `<rect x="${ax}" y="${ay}" width="260" height="56" rx="28" fill="#1f6f5c" stroke="${INK}" stroke-width="3"/>` + text(ax + 130, ay + 36, "Ambil nomor", { size: 20, weight: 800, anchor: "middle", fill: "#ffffff" });
  b += `<rect x="${ax + 24}" y="${ay + 12}" width="212" height="32" fill="none" stroke="${PINK}" stroke-width="3" stroke-dasharray="6 5"/>`;
  b += line(ax, ay - 16, ax + 24, ay - 16, { sw: 2 }) + text(ax + 12, ay - 24, "24", S({ size: 15, anchor: "middle", weight: 800 }));
  b += line(ax + 236, ay - 16, ax + 260, ay - 16, { sw: 2 }) + text(ax + 248, ay - 24, "24", S({ size: 15, anchor: "middle", weight: 800 }));
  b += line(ax + 280, ay, ax + 280, ay + 12, { sw: 2 }) + text(ax + 290, ay + 12, "12", S({ size: 15, weight: 800 }));
  b += line(ax + 280, ay + 44, ax + 280, ay + 56, { sw: 2 }) + text(ax + 290, ay + 56, "12", S({ size: 15, weight: 800 }));
  b += `<rect x="${ax}" y="${ay + 100}" width="380" height="56" rx="28" fill="#1f6f5c" stroke="${INK}" stroke-width="3"/>` + text(ax + 190, ay + 136, "Ambil nomor Poli Gigi", { size: 20, weight: 800, anchor: "middle", fill: "#ffffff" });
  b += text(ax, ay + 186, "teks lebih panjang → tombol ikut melebar", S({ size: 17, weight: 700 }));
  b += mono(560, 180, "padding: jarak/12, jarak/24", { size: 17 }) + mono(560, 210, "isi: warna/utama", { size: 17 }) + mono(560, 240, "radius: radius/penuh", { size: 17 }) + mono(560, 270, "teks: judul/kecil", { size: 17 });
  b += mono(560, 300, "nama layer: Tombol/Utama", { size: 17 });
  // variant grid
  const gy = 400;
  b += text(60, gy, "Component set: Jenis × Status", { size: 24, weight: 800 });
  b += `<rect x="60" y="${gy + 20}" width="1080" height="250" rx="16" fill="none" stroke="#8a5cf6" stroke-width="3" stroke-dasharray="10 8"/>`;
  const st = ["Normal", "Ditekan", "Nonaktif"];
  st.forEach((s, i) => { b += text(380 + i * 270, gy + 60, `Status=${s}`, { size: 17, weight: 800, anchor: "middle", mono: true }); });
  const look = {
    Utama: [["#1f6f5c", "#ffffff", INK], ["#174f42", "#ffffff", INK], ["#c9cdcb", "#6b706d", "#9aa09d"]],
    Sekunder: [["#ffffff", "#1f6f5c", "#1f6f5c"], ["#e6f0ed", "#1f6f5c", "#1f6f5c"], ["#ffffff", "#9aa09d", "#c9cdcb"]],
  };
  Object.entries(look).forEach(([j, arr], r) => {
    const y = gy + 90 + r * 86;
    b += text(90, y + 36, `Jenis=${j}`, { size: 17, weight: 800, mono: true });
    arr.forEach(([bg, fg, stroke], i) => {
      const x = 270 + i * 270;
      b += `<rect x="${x}" y="${y}" width="220" height="56" rx="28" fill="${bg}" stroke="${stroke}" stroke-width="3"/>` + text(x + 110, y + 36, "Ambil nomor", { size: 19, weight: 800, anchor: "middle", fill: fg });
    });
  });
  b += note(gy + 320, "Enam variant dalam satu set: di salinan cukup pilih Jenis dan Status dari panel kanan.");
  return frame("Komponen Tombol: auto layout dengan padding 12 dan 24 yang ikut melebar sesuai teks, dan component set enam variant Jenis Utama atau Sekunder kali Status Normal, Ditekan, Nonaktif", gy + 350, b, AH);
}

const DIAGRAMS = { "user-flow": userFlow, "wireframe-lowfi": wireframe, "design-system": designSystem, "komponen-variant": komponen };
mkdirSync("public/studio/studi-kasus-desain-aplikasi", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/studi-kasus-desain-aplikasi/${name}.svg`, draw());
  console.log(name);
}
