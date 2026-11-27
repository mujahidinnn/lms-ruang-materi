// Diagrams for Studio Proyek "ekstensi-browser-fokus", embedded as ![ket](/studio/ekstensi-browser-fokus/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/ekstensi-browser-fokus.mjs
// popup-fokus.webp and tetap-fokus.webp are screenshots of the verified build
// (.cache/verify-ekstensi-browser-fokus), not drawn here.
import { mkdirSync, writeFileSync } from "node:fs";

const INK = "#0f100d", M1 = "#e3edc8", M3 = "#b5d36f", PINK = "#f4b6c2";
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
const AH = '<marker id="ah" markerWidth="14" markerHeight="14" refX="11" refY="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L14 7L0 14z" fill="#0f100d"/></marker>';
const arrow = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="5" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""} marker-end="url(#ah)"/>`;
const curve = (d, o = {}) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""} marker-end="url(#ah)"/>`;
const S = (o = {}) => ({ size: 20, weight: 500, ...o });
const mono = (x, y, s, o = {}) => text(x, y, s, { size: 18, weight: 600, mono: true, ...o });
const lines = (x, y, arr, o = {}, gap = 28) => arr.map((s, i) => text(x, y + i * gap, s, S(o))).join("");

// State machine: diam -> fokus -> istirahat -> diam, Berhenti from anywhere.
function alurSesi() {
  let b = text(600, 58, "Tiga keadaan sesi Fokus Dulu", { size: 38, weight: 800, anchor: "middle" });
  const st = [
    { x: 60, n: "Diam", d: ["tanpa mode", "badge kosong"], f: "#ffffff" },
    { x: 460, n: "Fokus · 25 menit", d: ["aturan blokir AKTIF", "badge hijau: menit sisa"], f: M3 },
    { x: 860, n: "Istirahat · 5 menit", d: ["aturan blokir dicabut", "badge abu-abu"], f: M1 },
  ];
  const y = 250, w = 280, h = 150;
  for (const s of st) {
    b += box(s.x, y, w, h, { fill: s.f });
    b += text(s.x + w / 2, y + 52, s.n, { size: 26, weight: 800, anchor: "middle" });
    b += lines(s.x + w / 2, y + 92, s.d, { anchor: "middle" });
  }
  // forward arrows
  b += arrow(344, 325, 452, 325);
  b += text(398, 206, "Mulai", { size: 22, weight: 800, anchor: "middle" });
  b += text(398, 234, "popup / Alt+Shift+F", S({ size: 17, anchor: "middle" }));
  b += arrow(744, 325, 852, 325);
  b += mono(798, 206, 'alarm "sesi"', { anchor: "middle", size: 17 });
  b += text(798, 234, "+ notifikasi", S({ size: 17, anchor: "middle" }));
  // istirahat -> diam (below)
  b += curve("M1000 404 C1000 520, 200 520, 200 412");
  b += mono(600, 540, 'alarm "sesi" berbunyi lagi', { anchor: "middle" });
  b += text(600, 570, "notifikasi “Istirahat selesai”, kembali diam", S({ anchor: "middle", size: 19 }));
  // Berhenti (top, dashed)
  b += curve("M600 246 C600 140, 200 140, 200 242", { dash: "12 10" });
  b += curve("M1000 246 C1000 110, 230 100, 214 240", { dash: "12 10" });
  b += text(600, 112, "Berhenti (dari mana saja): cabut aturan, hapus alarm dan badge", { size: 20, weight: 700, anchor: "middle" });
  // storage note
  b += box(120, 610, 960, 120, { fill: "#ffffff", dash: "10 8", sw: 3 });
  b += text(600, 650, "Yang disimpan hanya dua nilai di chrome.storage.local", { size: 22, weight: 800, anchor: "middle" });
  b += mono(400, 684, 'mode: "fokus" | "istirahat"', { anchor: "middle", size: 19 });
  b += mono(820, 684, "akhir: Date.now() + durasi", { anchor: "middle", size: 19 });
  b += text(600, 716, "Sisa waktu selalu dihitung: akhir − Date.now(), jadi tetap benar walau service worker tidur.", S({ anchor: "middle", size: 18 }));
  return frame("Mesin keadaan Fokus Dulu: Mulai memindahkan diam ke fokus dan memasang aturan blokir, alarm sesi memindahkan fokus ke istirahat lalu ke diam dengan notifikasi, Berhenti dari mana saja kembali ke diam. Yang disimpan hanya mode dan waktu akhir.", 760, b, AH);
}

// Architecture: extension pages talk to the service worker via messages and storage.
function bagianEkstensi() {
  let b = text(600, 58, "Siapa bicara dengan siapa di Fokus Dulu", { size: 38, weight: 800, anchor: "middle" });
  // left: pages
  b += text(170, 112, "Halaman ekstensi", { size: 22, weight: 800, anchor: "middle" });
  const pages = [["popup.html", "tombol + sisa waktu", 140], ["options.html", "daftar situs + izin", 300], ["blocked.html", "“Tetap fokus, ya.”", 460]];
  for (const [n, d, y] of pages) {
    b += box(40, y, 260, 100);
    b += mono(170, y + 44, n, { anchor: "middle", size: 21 });
    b += text(170, y + 76, d, S({ anchor: "middle", size: 18 }));
  }
  // middle: service worker
  b += box(420, 130, 340, 150, { fill: M3 });
  b += text(590, 180, "Service worker", { size: 26, weight: 800, anchor: "middle" });
  b += mono(590, 212, "background.js", { anchor: "middle" });
  b += text(590, 248, "satu-satunya yang mengubah sesi", S({ anchor: "middle", size: 18 }));
  // middle: storage
  b += box(420, 400, 340, 170, { fill: M1 });
  b += text(590, 444, "chrome.storage", { size: 24, weight: 800, anchor: "middle" });
  b += mono(440, 486, "local: mode, akhir", { size: 18 });
  b += mono(440, 520, "sync:  situs[]", { size: 18 });
  b += text(440, 552, "ikut ke Chrome lain milikmu", S({ size: 16 }));
  // arrows pages -> sw / storage
  b += arrow(304, 180, 412, 190);
  b += mono(358, 160, "sendMessage", { anchor: "middle", size: 15 });
  b += arrow(304, 350, 412, 470);
  b += mono(330, 432, "set situs", { anchor: "middle", size: 15 });
  b += arrow(412, 530, 308, 510, { dash: "8 8" });
  b += mono(366, 566, "baca akhir", { anchor: "middle", size: 15 });
  b += arrow(590, 284, 590, 392);
  b += mono(600, 344, "simpan / baca", { size: 15 });
  // right: chrome APIs
  b += text(1010, 112, "API yang dipegang service worker", { size: 20, weight: 800, anchor: "middle" });
  const apis = [["chrome.alarms", "bangunkan saat sesi habis"], ["declarativeNetRequest", "aturan redirect saat fokus"], ["chrome.action", "teks badge di ikon"], ["chrome.notifications", "kabar sesi selesai"], ["chrome.commands", "Alt+Shift+F"]];
  apis.forEach(([n, d], i) => {
    const y = 134 + i * 96;
    b += box(860, y, 300, 80);
    b += mono(1010, y + 34, n, { anchor: "middle", size: 18 });
    b += text(1010, y + 62, d, S({ anchor: "middle", size: 17 }));
    b += arrow(764, 205, 852, y + 40);
  });
  b += box(40, 610, 1120, 64, { fill: "#ffffff", dash: "10 8", sw: 3 });
  b += text(600, 650, "Chrome boleh mematikan service worker kapan saja; alarm menyalakannya lagi, keadaan dibaca dari storage.", S({ anchor: "middle", size: 19, weight: 600 }));
  return frame("Bagian-bagian Fokus Dulu: popup mengirim pesan ke service worker, halaman pengaturan menyimpan daftar situs ke storage sync, halaman Tetap fokus membaca waktu akhir dari storage; service worker memegang alarm, aturan declarativeNetRequest, badge, notifikasi, dan pintasan keyboard.", 700, b, AH);
}

const DIAGRAMS = { "alur-sesi": alurSesi, "bagian-ekstensi": bagianEkstensi };
mkdirSync("public/studio/ekstensi-browser-fokus", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/ekstensi-browser-fokus/${name}.svg`, draw());
  console.log(name);
}
