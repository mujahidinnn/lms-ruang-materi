// Diagrams for Studio Proyek "aplikasi-daftar-tugas", embedded as ![ket](/studio/aplikasi-daftar-tugas/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/aplikasi-daftar-tugas.mjs
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

const chk = (x, y, on) => `<rect x="${x}" y="${y}" width="26" height="26" rx="5" fill="${on ? "#2f6b45" : "#ffffff"}" stroke="${INK}" stroke-width="3"/>` + (on ? `<path d="M${x + 6} ${y + 13}l5 6l10 -12" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : "");
const DATA = [["a1", "Beli susu", true], ["a2", "Kerjakan PR", false], ["a3", "Cuci sepatu", false]];

// The array is the truth; the list on screen is drawn from it through the filter.
function dataKeTampilan() {
  let b = text(600, 58, "Tampilan digambar dari data", { size: 40, weight: 800, anchor: "middle" });
  b += text(60, 120, "Data (array tugas)", { size: 26, weight: 800 });
  b += box(40, 140, 470, 400, { fill: M1, r: 18 });
  b += text(64, 182, "let tugas = [", { size: 22, weight: 700, mono: true });
  DATA.forEach(([id, t, s], i) => {
    const y = 205 + i * 92;
    b += box(80, y, 400, 76, { r: 10, sw: 3 }) + text(98, y + 32, `{ id: "${id}", teks: "${t}",`, { size: 19, weight: 600, mono: true }) + text(98, y + 60, `  selesai: ${s} }`, { size: 19, weight: 600, mono: true });
  });
  b += text(64, 510, "];", { size: 22, weight: 700, mono: true });
  b += box(40, 560, 470, 60, { r: 14 }) + text(64, 598, 'let filter = "aktif";', { size: 22, weight: 700, mono: true });
  // Function in the middle
  b += box(560, 300, 180, 110, { fill: M3, r: 18 }) + text(650, 348, "render()", { size: 24, weight: 800, anchor: "middle", mono: true }) + text(650, 382, "pakai terlihat()", S({ size: 18, anchor: "middle" }));
  b += arrow(512, 355, 554, 355) + line(512, 590, 650, 590, { sw: 5, dash: "2 10" }) + arrow(650, 590, 650, 418, { dash: "2 10" });
  b += arrow(742, 355, 792, 355);
  // Screen
  b += text(800, 120, "Layar (filter Aktif)", { size: 26, weight: 800 });
  b += box(800, 140, 360, 400, { r: 22 });
  b += `<rect x="824" y="164" width="72" height="34" rx="10" fill="#ffffff" stroke="${INK}" stroke-width="2"/>` + text(860, 188, "Semua", S({ size: 16, anchor: "middle" }));
  b += `<rect x="906" y="164" width="72" height="34" rx="10" fill="${INK}"/>` + text(942, 188, "Aktif", { size: 16, weight: 700, anchor: "middle", fill: "#ffffff" });
  b += `<rect x="988" y="164" width="80" height="34" rx="10" fill="#ffffff" stroke="${INK}" stroke-width="2"/>` + text(1028, 188, "Selesai", S({ size: 16, anchor: "middle" }));
  DATA.filter((d) => !d[2]).forEach(([id, t], i) => {
    const y = 222 + i * 76;
    b += box(824, y, 312, 62, { r: 10, sw: 3 }) + chk(840, y + 18, false) + text(882, y + 39, t, S({ size: 21 })) + text(1120, y + 39, "Hapus", S({ size: 17, anchor: "end", fill: "#a33b2b" }));
    b += text(1150, y + 39, "", S());
  });
  b += text(980, 420, "2 tugas belum selesai", S({ size: 20, anchor: "middle" }));
  b += note(670, '"Beli susu" tidak hilang dari array, hanya tidak lolos filter. Ganti filter ke Semua, ia tampil lagi.');
  b += note(708, "Setiap tugas butuh id: dua tugas boleh punya teks yang sama, tapi id-nya pasti beda.");
  return frame("Array tugas dan variabel filter masuk ke render, yang hanya menampilkan tugas aktif di layar", 740, b, AH);
}

// One loop for every change: event, change the array, save, redraw.
function siklus() {
  let b = text(600, 58, "Pola inti: ubah data, lalu gambar ulang", { size: 40, weight: 800, anchor: "middle" });
  const node = (x, y, w, title, sub, fill = "#ffffff") => box(x, y, w, 120, { fill, r: 18 }) + text(x + w / 2, y + 52, title, { size: 26, weight: 800, anchor: "middle" }) + text(x + w / 2, y + 90, sub, { size: 20, weight: 600, anchor: "middle", mono: true });
  b += node(60, 120, 330, "1. Pengguna", "submit / change / click");
  b += node(450, 120, 300, "2. Ubah array", "tugas.push(...)", M1);
  b += node(810, 120, 330, "3. perbarui()", "simpan(); render();", M3);
  b += node(810, 360, 330, "4. render()", "replaceChildren(...)");
  b += node(450, 360, 300, "5. Layar baru", "<ul> berisi <li>");
  b += box(60, 360, 330, 120, { fill: M1, r: 18, dash: "10 8", sw: 3 }) + text(225, 410, "localStorage", { size: 26, weight: 800, anchor: "middle" }) + text(225, 448, '"daftar-tugas"', { size: 20, weight: 600, anchor: "middle", mono: true });
  b += arrow(392, 180, 444, 180) + arrow(752, 180, 804, 180) + arrow(975, 242, 975, 354) + arrow(808, 420, 756, 420);
  b += line(600, 482, 600, 540, { sw: 5 }) + line(600, 540, 30, 540, { sw: 5 }) + line(30, 540, 30, 180, { sw: 5 }) + arrow(30, 180, 54, 180);
  b += text(315, 572, "pengguna melihat hasilnya, lalu berbuat lagi", S({ anchor: "middle", size: 20 }));
  b += `<path d="M860 244 C 800 320, 440 300, 394 400" fill="none" stroke="${INK}" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" marker-end="url(#ah)"/>`;
  b += text(225, 342, "simpan(): JSON.stringify", S({ anchor: "middle", size: 19, mono: true }));
  b += note(640, "Tombol filter melompati langkah 2 dan 3: ia hanya mengganti variabel filter lalu memanggil render().");
  b += note(678, "Kalau layar salah, periksa dua tempat saja: isi array tugas di Console, dan fungsi render().");
  return frame("Siklus aplikasi daftar tugas: pengguna berbuat, array tugas diubah, perbarui menyimpan ke localStorage dan memanggil render, layar digambar ulang", 710, b, AH);
}

// Event delegation: one listener on <ul> catches clicks from any item.
function delegasi() {
  let b = text(600, 58, "Satu pendengar di <ul> untuk semua item", { size: 40, weight: 800, anchor: "middle" });
  b += box(60, 110, 620, 420, { fill: M1, r: 20 }) + text(84, 150, '<ul id="daftar-tugas">', { size: 22, weight: 700, mono: true });
  b += `<rect x="420" y="124" width="240" height="40" rx="20" fill="${M3}" stroke="${INK}" stroke-width="3"/>` + text(540, 151, "addEventListener", { size: 18, weight: 700, mono: true, anchor: "middle" });
  DATA.forEach(([id, t, s], i) => {
    const y = 180 + i * 112, hot = i === 1;
    b += box(90, y, 560, 92, { r: 12, sw: hot ? 5 : 3 }) + text(110, y + 26, `<li data-id="${id}">`, { size: 17, weight: 600, mono: true });
    b += chk(112, y + 44, s) + text(152, y + 66, t, S({ size: 21 }));
    b += `<rect x="520" y="${y + 40}" width="110" height="40" rx="10" fill="${hot ? "#f4b6c2" : "#ffffff"}" stroke="${INK}" stroke-width="${hot ? 4 : 2}"/>` + text(575, y + 67, "Hapus", { size: 18, weight: 700, anchor: "middle" });
  });
  // Bubble path for the hot item
  b += `<path d="M632 352 C 750 352, 750 160, 666 146" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" marker-end="url(#ah)"/>`;
  b += text(696, 388, "1. klik", S({ size: 20, weight: 700 }));
  b += text(745, 232, "2. menggelembung", S({ size: 20, weight: 700 })) + text(745, 258, "button → li → ul", S({ size: 18 }));
  b += box(780, 300, 380, 230, { r: 18 }) + text(800, 340, "3. Di pendengar <ul>:", { size: 22, weight: 800 });
  [["e.target", "tombol Hapus"], ['.closest("li")', "<li> terdekat"], [".dataset.id", '"a2"']].forEach(([c, d], i) => {
    b += text(800, 390 + i * 46, c, { size: 20, weight: 700, mono: true }) + text(1140, 390 + i * 46, d, S({ size: 20, anchor: "end" }));
  });
  b += note(590, "Item dibuat ulang setiap render(), jadi pendengar di tiap tombol akan ikut hilang.");
  b += note(628, "<ul> tidak pernah diganti, jadi satu pendengar di sana cukup untuk item lama dan baru.");
  return frame("Event delegation: klik tombol Hapus menggelembung ke ul, lalu closest li dan dataset.id memberi id tugas", 660, b, AH);
}

const DIAGRAMS = { "data-ke-tampilan": dataKeTampilan, "siklus-ubah-render": siklus, "event-delegation": delegasi };
mkdirSync("public/studio/aplikasi-daftar-tugas", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/aplikasi-daftar-tugas/${name}.svg`, draw());
  console.log(name);
}
