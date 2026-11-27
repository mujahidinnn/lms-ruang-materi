// Diagrams for Studio Proyek "absensi-qr-code", embedded as ![ket](/studio/absensi-qr-code/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/absensi-qr-code.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const INK = "#0f100d", M1 = "#e3edc8", M3 = "#b5d36f";
const esc = (s) => String(s).replace(/^ +/, (m) => "\u00a0".repeat(m.length)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
const note = (y, s, w = 500) => text(600, y, s, { size: 22, anchor: "middle", weight: w });

// Time windows of 30 s, one signed token each; current + previous accepted.
function tokenBerputar() {
  let b = text(600, 58, "QR berganti tiap 30 detik", { size: 40, weight: 800, anchor: "middle" });
  const wins = [
    ["59012343", "09:59:30 - 10:00:00", "12.59012343.k9P…", "ditolak: kedaluwarsa", "#ffffff", "10 8"],
    ["59012344", "10:00:00 - 10:00:30", "12.59012344.xQ7…", "diterima", M1],
    ["59012345", "10:00:30 - 10:01:00", "12.59012345.Q2x…", "di layar sekarang", M3],
    ["59012346", "10:01:00 - 10:01:30", "belum dibuat", "belum ada", "#ffffff", "10 8"],
  ];
  wins.forEach(([w, t, tok, st, fill, dash], i) => {
    const x = 40 + i * 285, cx = x + 132;
    b += box(x, 100, 265, 170, { fill, r: 16, dash });
    b += text(cx, 140, `jendela ${w}`, { size: 19, weight: 800, anchor: "middle", mono: true });
    b += text(cx, 176, t, S({ anchor: "middle", size: 18 }));
    b += text(cx, 214, tok, { size: 17, weight: 600, anchor: "middle", mono: true });
    b += text(cx, 252, st, { size: 19, weight: 800, anchor: "middle", fill: i === 0 ? "#b42318" : INK });
  });
  // Accepted bracket over windows 2-3
  b += line(325, 296, 875, 296, { sw: 4 }) + line(325, 284, 325, 296, { sw: 4 }) + line(875, 284, 875, 296, { sw: 4 });
  b += text(600, 330, "diterima server: jendela sekarang + 1 sebelumnya, jadi umur token 30 sampai 60 detik", S({ anchor: "middle", size: 20, weight: 700 }));
  b += arrow(40, 372, 1150, 372) + text(1150, 402, "waktu", S({ anchor: "end", size: 19 }));
  // Make / verify
  b += box(40, 430, 540, 240, { fill: M1, r: 18 });
  b += text(64, 472, "Membuat (layar meminta QR)", { size: 23, weight: 800 });
  ["jendela = floor(waktuMs / 30000)", "ttd = HMAC-SHA256(QR_SECRET,", '            "12.59012345")', "isi QR = 12.59012345.ttd"].forEach(
    (l, i) => (b += text(64, 516 + i * 36, l, { size: 18, weight: 600, mono: true })));
  b += box(620, 430, 540, 240, { r: 18 });
  b += text(644, 472, "Memeriksa (peserta absen)", { size: 23, weight: 800 });
  ["1. hitung ulang ttd dari id + jendela,", "   bandingkan dengan timingSafeEqual", "2. jendela harus sekarang atau", "   sekarang - 1"].forEach(
    (l, i) => (b += text(644, 516 + i * 34, l, S({ size: 20 }))));
  b += note(712, "Tanpa QR_SECRET tidak ada yang bisa membuat ttd yang cocok, dan server tidak perlu menyimpan token.");
  return frame("Waktu dibagi jendela 30 detik, tiap jendela punya token idSesi.jendela.tandaTangan HMAC; server menerima jendela sekarang dan satu sebelumnya", 750, b, AH);
}

// One check-in: from phone camera through five server checks to DB and SSE.
function alurAbsensi() {
  let b = text(600, 58, "Perjalanan satu absen", { size: 40, weight: 800, anchor: "middle" });
  // Left: layar and HP
  b += box(30, 110, 250, 190, { fill: M1, r: 18 });
  ["Layar panitia", "laptop + proyektor", "QR + daftar hadir"].forEach((l, i) => (b += text(155, 160 + i * 40, l, S({ anchor: "middle", size: i ? 19 : 24, weight: i ? 500 : 800 }))));
  b += box(30, 440, 250, 190, { r: 18 });
  ["HP peserta", "/scan", "BarcodeDetector", "atau jsQR"].forEach((l, i) => (b += text(155, 488 + i * 36, l, S({ anchor: "middle", size: i ? 19 : 24, weight: i ? 500 : 800, mono: i === 1 }))));
  b += arrow(155, 302, 155, 432) + text(170, 362, "kamera", S({ size: 18 })) + text(170, 386, "memindai QR", S({ size: 18 }));
  // Server column
  b += box(440, 96, 380, 500, { r: 20, dash: "12 8", sw: 3 }) + text(630, 132, "Server Express", { size: 22, weight: 800, anchor: "middle" });
  const checks = [
    ["1. Tanda tangan HMAC cocok?", "tidak: 400 QR tidak sah"],
    ["2. Masih 2 jendela terakhir?", "tidak: 400 kedaluwarsa"],
    ["3. Sesi ada dan dibuka?", "tidak: 404 / 409"],
    ["4. NIM dan nama wajar?", "tidak: 422 + details"],
    ["5. INSERT ke checkins", "ganda: 409   berhasil: 201"],
  ];
  checks.forEach(([a, c], i) => {
    const y = 150 + i * 88;
    b += box(460, y, 340, 74, { fill: i === 4 ? M3 : "#ffffff", r: 12, sw: 3 });
    b += text(476, y + 31, a, { size: 19, weight: 800 });
    b += text(476, y + 60, c, S({ size: 17 }));
  });
  // Arrows between left and server
  b += arrow(438, 165, 288, 165) + text(363, 152, "QR baru /30 dtk", S({ anchor: "middle", size: 16, weight: 700 }));
  b += arrow(438, 250, 288, 250) + text(363, 237, "SSE: hadir", S({ anchor: "middle", size: 16, weight: 700 }));
  b += arrow(282, 535, 432, 535) + text(357, 520, "POST token", S({ anchor: "middle", size: 16, weight: 700 })) + text(357, 562, "+ NIM, nama", S({ anchor: "middle", size: 16 }));
  // Right: DB + failure note
  b += arrow(802, 539, 868, 539);
  b += box(874, 470, 296, 150, { fill: M1, r: 18 });
  ["SQLite: checkins", "UNIQUE (sesi, nim)", "UNIQUE (sesi, perangkat)"].forEach((l, i) => (b += text(1022, 510 + i * 38, l, { size: i ? 17 : 21, weight: i ? 600 : 800, anchor: "middle", mono: i > 0 })));
  b += box(874, 150, 296, 250, { r: 18, sw: 3, dash: "10 8" });
  ["Gagal di langkah", "mana pun:", "tidak ada yang", "tersimpan, HP", "menampilkan", "pesan errornya"].forEach((l, i) => (b += text(1022, 192 + i * 34, l, S({ anchor: "middle", size: 20, weight: i < 2 ? 800 : 500 }))));
  b += note(684, "Setelah INSERT berhasil, kabarkan() mengirim event \"hadir\" ke semua layar yang menonton sesi itu.");
  b += note(720, "Jam yang dipakai hanya jam server, saat membuat maupun memeriksa token.");
  return frame("Alur absensi: layar menampilkan QR, HP memindai dan mengirim token, server memeriksa tanda tangan, jendela waktu, sesi, data, lalu INSERT dengan UNIQUE, dan SSE mengabari layar", 760, b, AH);
}

const DIAGRAMS = { "token-berputar": tokenBerputar, "alur-absensi": alurAbsensi };
mkdirSync("public/studio/absensi-qr-code", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/absensi-qr-code/${name}.svg`, draw());
  console.log(name);
}
