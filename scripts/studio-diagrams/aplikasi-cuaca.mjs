// Diagrams for Studio Proyek "aplikasi-cuaca", embedded as ![ket](/studio/aplikasi-cuaca/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/aplikasi-cuaca.mjs
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

// Every screen state and what moves between them.
function keadaan() {
  let b = text(600, 58, "Keadaan layar aplikasi cuaca", { size: 40, weight: 800, anchor: "middle" });
  const st = (x, y, w, h, title, sub, fill = "#ffffff") => box(x, y, w, h, { fill, r: 18 }) + text(x + w / 2, y + 44, title, { size: 25, weight: 800, anchor: "middle" }) + sub.map((l, i) => text(x + w / 2, y + 80 + i * 28, l, S({ size: 19, anchor: "middle" }))).join("");
  b += st(60, 110, 300, 130, "Awal", ["cari kota atau", "pakai lokasi"]);
  b += st(450, 110, 300, 130, "Memuat", ["\"Memuat cuaca...\"", "tombol nonaktif"], M1);
  b += st(840, 110, 300, 130, "Berhasil", ["kartu sekarang", "dan 7 hari"], M3);
  b += arrow(362, 160, 444, 160) + text(403, 146, "Cari", S({ size: 18, anchor: "middle", weight: 700 })) + text(403, 196, "Lokasiku", S({ size: 18, anchor: "middle", weight: 700 }));
  b += arrow(752, 175, 834, 175);
  // Failures
  const fail = [["Kota tidak ditemukan", "sebut nama yang diketik"], ["Internet putus / server", "sarankan coba lagi"], ["Izin lokasi ditolak", "arahkan ke cari kota"]];
  fail.forEach(([t, s], i) => {
    const x = 60 + i * 380;
    b += box(x, 380, 320, 120, { fill: PINK, r: 18 }) + text(x + 160, 426, t, { size: 22, weight: 800, anchor: "middle" }) + text(x + 160, 464, s, S({ size: 19, anchor: "middle" }));
    b += arrow(600, 242, x + 160, 374);
  });
  b += text(612, 300, "gagal", S({ size: 20, weight: 700 }));
  b += box(840, 540, 300, 110, { fill: M1, r: 18, dash: "10 8", sw: 3 }) + text(990, 584, "Dibuka lagi besok", { size: 22, weight: 800, anchor: "middle" }) + text(990, 620, "tempat terakhir → Memuat", S({ size: 19, anchor: "middle" }));
  b += `<path d="M860 540 C 780 530, 780 300, 720 246" fill="none" stroke="${INK}" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" marker-end="url(#ah)"/>`;
  b += text(60, 560, "Dari keadaan gagal, pengguna", S({ size: 21 })) + text(60, 590, "cukup mencari lagi: kembali", S({ size: 21 })) + text(60, 620, "ke Memuat, bukan muat ulang.", S({ size: 21 }));
  b += note(700, "Semua pesan, termasuk gagal, tampil di satu baris status yang dibacakan pembaca layar.");
  return frame("Keadaan layar: awal, memuat, berhasil, dan tiga keadaan gagal; membuka lagi memuat tempat terakhir", 730, b, AH);
}

// Two requests: name to coordinates, coordinates to weather.
function duaPermintaan() {
  let b = text(600, 58, "Dua permintaan: nama kota → koordinat → cuaca", { size: 38, weight: 800, anchor: "middle" });
  b += box(40, 110, 220, 120, { r: 18 }) + text(150, 160, "Pengguna", { size: 25, weight: 800, anchor: "middle" }) + mono(150, 198, '"Bandung"', { anchor: "middle" });
  b += box(340, 100, 820, 150, { fill: M1, r: 18 }) + text(364, 140, "1. Geocoding", { size: 24, weight: 800 });
  b += mono(364, 176, "geocoding-api.open-meteo.com/v1/search");
  b += mono(364, 206, "?name=Bandung&count=1&language=id");
  b += mono(364, 236, '→ results[0].latitude, results[0].longitude', { weight: 700 });
  b += arrow(262, 170, 334, 170);
  b += box(340, 300, 820, 150, { fill: M3, r: 18 }) + text(364, 340, "2. Forecast", { size: 24, weight: 800 });
  b += mono(364, 376, "api.open-meteo.com/v1/forecast");
  b += mono(364, 406, "?latitude=-6.92&longitude=107.61&current=...&daily=...");
  b += mono(364, 436, "→ current { temperature_2m, weather_code } dan daily", { weight: 700 });
  b += arrow(750, 252, 750, 294);
  b += box(40, 310, 220, 120, { r: 18 }) + text(150, 354, "Pakai", { size: 24, weight: 800, anchor: "middle" }) + text(150, 386, "lokasiku", { size: 24, weight: 800, anchor: "middle" }) + text(150, 416, "lat, lon dari browser", S({ size: 16, anchor: "middle" }));
  b += arrow(262, 370, 334, 370);
  b += box(340, 500, 820, 90, { r: 18 }) + text(364, 540, "Tanpa hasil:", { size: 21, weight: 800 }) + mono(520, 540, "results tidak ada sama sekali") + text(364, 574, "Koordinat salah:", { size: 21, weight: 800 }) + mono(560, 574, 'status 400, { "error": true, "reason": ... }');
  b += note(640, "Jalan pintas lokasiku melompati geocoding karena koordinatnya sudah ada.");
  return frame("Alur dua permintaan ke Open-Meteo: geocoding mengubah nama kota jadi koordinat, forecast mengubah koordinat jadi cuaca; lokasiku langsung ke forecast", 670, b, AH);
}

// ambilJson: the two different ways a request can fail.
function ambilJson() {
  let b = text(600, 58, "ambilJson: dua cara permintaan gagal", { size: 40, weight: 800, anchor: "middle" });
  b += box(60, 120, 300, 110, { fill: M1, r: 18 }) + mono(210, 170, "await fetch(url)", { anchor: "middle", size: 22, weight: 700 }) + text(210, 204, "minta ke server", S({ size: 19, anchor: "middle" }));
  b += box(470, 120, 300, 110, { fill: M3, r: 18 }) + mono(620, 170, "respons.ok ?", { anchor: "middle", size: 22, weight: 700 }) + text(620, 204, "status 200-299?", S({ size: 19, anchor: "middle" }));
  b += box(880, 120, 260, 110, { r: 18 }) + mono(1010, 170, "respons.json()", { anchor: "middle", size: 22, weight: 700 }) + text(1010, 204, "data siap dipakai", S({ size: 19, anchor: "middle" }));
  b += arrow(362, 175, 464, 175) + text(413, 160, "ada jawaban", S({ size: 15, anchor: "middle" }));
  b += arrow(772, 175, 874, 175) + text(823, 160, "true", { size: 19, weight: 700, mono: true, anchor: "middle" });
  b += arrow(210, 232, 210, 324) + text(226, 286, "melempar error", S({ size: 19, weight: 700 }));
  b += arrow(620, 232, 620, 324) + text(636, 286, "false: 404, 500, ...", S({ size: 19, weight: 700 }));
  b += box(60, 330, 380, 130, { fill: PINK, r: 18 }) + text(250, 374, "Koneksi putus", { size: 23, weight: 800, anchor: "middle" }) + text(250, 410, '"Tidak bisa terhubung ke', S({ size: 18, anchor: "middle" })) + text(250, 436, 'server cuaca..."', S({ size: 18, anchor: "middle" }));
  b += box(470, 330, 380, 130, { fill: PINK, r: 18 }) + text(660, 374, "Server menolak", { size: 23, weight: 800, anchor: "middle" }) + text(660, 410, '"Server cuaca menolak', S({ size: 18, anchor: "middle" })) + text(660, 436, 'permintaan (kode 400)..."', S({ size: 18, anchor: "middle" }));
  b += box(880, 330, 260, 130, { r: 18, dash: "10 8", sw: 3 }) + text(1010, 374, "tampilkanUntuk", { size: 20, weight: 800, anchor: "middle", mono: true }) + text(1010, 408, "catch → baris status", S({ size: 18, anchor: "middle" })) + text(1010, 436, "finally → tombol aktif", S({ size: 18, anchor: "middle" }));
  b += line(250, 462, 250, 500) + line(660, 462, 660, 500) + line(250, 500, 1010, 500) + arrow(1010, 500, 1010, 466);
  b += note(560, "fetch tidak melempar error untuk 404 atau 500. Tanpa cek respons.ok, galat server lolos diam-diam.");
  return frame("ambilJson: fetch melempar error saat koneksi putus, respons.ok bernilai false saat server menjawab 4xx atau 5xx; keduanya ditangkap tampilkanUntuk", 600, b, AH);
}

// daily comes as parallel arrays; index i picks one day from each.
function arraySejajar() {
  let b = text(600, 58, "data.daily: array sejajar, satu indeks = satu hari", { size: 38, weight: 800, anchor: "middle" });
  const cols = [["time", ["2026-11-27", "2026-11-28", "2026-11-29", "..."]], ["weather_code", ["80", "61", "3", "..."]], ["temperature_\n2m_max", ["27.1", "26.4", "27.8", "..."]], ["temperature_\n2m_min", ["19.2", "18.8", "19.0", "..."]], ["precipitation_\nprobability_max", ["78", "65", "30", "..."]]];
  const x0 = 150, cw = 200, y0 = 110;
  b += text(110, y0 + 130, "i = 0", { size: 20, weight: 700, mono: true, anchor: "end" }) + text(110, y0 + 190, "i = 1", { size: 20, weight: 800, mono: true, anchor: "end" }) + text(110, y0 + 250, "i = 2", { size: 20, weight: 700, mono: true, anchor: "end" });
  b += `<rect x="${x0 - 14}" y="${y0 + 158}" width="${cols.length * cw + 8}" height="52" rx="12" fill="${M3}" stroke="${INK}" stroke-width="4"/>`;
  cols.forEach(([name, vals], c) => {
    const x = x0 + c * cw;
    b += box(x - 6, y0, cw - 12, 330, { fill: "#ffffff00", r: 14, sw: 3 });
    name.split("\n").forEach((l, k) => { b += mono(x + cw / 2 - 12, y0 + 34 + k * 24, l, { anchor: "middle", size: 17, weight: 700 }); });
    vals.forEach((v, r) => { b += mono(x + cw / 2 - 12, y0 + 136 + r * 60, v, { anchor: "middle", size: 20 }); });
  });
  b += arrow(600, y0 + 340, 600, y0 + 400);
  b += box(150, y0 + 410, 900, 80, { fill: M1, r: 18 });
  b += text(180, y0 + 460, "Sabtu, 28 Nov", { size: 24, weight: 800 }) + text(400, y0 + 460, "Hujan ringan", S({ size: 24 })) + text(640, y0 + 460, "26° / 19°", { size: 24, weight: 800 }) + text(820, y0 + 460, "Peluang hujan 65%", S({ size: 22 }));
  b += note(y0 + 540, "harian.time.map((tanggal, i) => ...) memakai i yang sama untuk mengambil nilai dari setiap array.");
  b += note(y0 + 578, '"2026-11-28" + "T00:00" dibaca sebagai waktu lokal, jadi harinya tidak mundur ke Jumat.');
  return frame("Data harian Open-Meteo berupa array sejajar: indeks 1 dari time, weather_code, suhu maksimum, minimum, dan peluang hujan membentuk satu baris hari", 720, b, AH);
}

const DIAGRAMS = { "keadaan-layar": keadaan, "dua-permintaan": duaPermintaan, "ambil-json": ambilJson, "array-sejajar": arraySejajar };
mkdirSync("public/studio/aplikasi-cuaca", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/aplikasi-cuaca/${name}.svg`, draw());
  console.log(name);
}
