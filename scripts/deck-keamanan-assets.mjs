// Renders the assets scripts/deck-keamanan.py needs into <dir>: lucide icons
// (icons/<name>-w.png white, -k.png green, 256px) and the deck diagrams
// (<name>.png, 1200x1000).
// Run: node scripts/deck-keamanan-assets.mjs <dir>
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const dir = process.argv[2];
if (!dir) throw new Error("usage: node scripts/deck-keamanan-assets.mjs <dir>");
mkdirSync(join(dir, "icons"), { recursive: true });

const ICONS = "shield shield-check lock key-round eye bug mail link triangle-exclamation-point users server wifi network globe file-text clipboard-check book-open rocket lightbulb layers scale target activity hash file-lock badge-check flame siren refresh-cw database bell search ban smartphone cloud code user-check hard-drive router check x list-checks settings package wrench".split(" ");
const attr = (o) => Object.entries(o).filter(([k]) => k !== "key").map(([k, v]) => `${k}="${v}"`).join(" ");
for (const name of ICONS) {
  const { __iconData } = await import(`../node_modules/lucide-react/dist/esm/icons/${name}.mjs`);
  const body = __iconData.node.map(([tag, a]) => `<${tag} ${attr(a)}/>`).join("");
  for (const [suffix, color] of [["w", "#ffffff"], ["k", "#10b981"]]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="256" height="256" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
    await sharp(Buffer.from(svg), { density: 300 }).resize(256, 256).png().toFile(join(dir, "icons", `${name}-${suffix}.png`));
  }
}

const INK = "#0f172a", G = "#10b981", GL = "#d1fae5", AM = "#f59e0b", AML = "#fef3c7", SL = "#f1f5f9", RED = "#ef4444", REDL = "#fee2e2";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const t = (x, y, s, { size = 30, w = 600, a = "middle", fill = INK, mono = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${w}" text-anchor="${a}" fill="${fill}"${mono ? ' font-family="DejaVu Sans Mono, monospace"' : ""}>${esc(s)}</text>`;
const box = (x, y, w, h, fill = "#fff", stroke = INK) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;
const arrow = (x1, y1, x2, y2, stroke = INK) => {
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
  const hx = x2 - ux * 22, hy = y2 - uy * 22;
  return `<line x1="${x1}" y1="${y1}" x2="${hx}" y2="${hy}" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/><polygon points="${x2},${y2} ${hx - uy * 12},${hy + ux * 12} ${hx + uy * 12},${hy - ux * 12}" fill="${stroke}"/>`;
};
const sheet = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1000" width="1200" height="1000" font-family="DejaVu Sans, sans-serif"><rect width="1200" height="1000" fill="#fff"/>${body}</svg>`;
const title = (s) => t(600, 70, s, { size: 40, w: 700 });

const D = {
  "ks-risiko": sheet([
    title("Dari aset ke risiko"),
    box(60, 130, 330, 130, SL), t(225, 185, "Aset", { size: 34, w: 700 }), t(225, 232, "yang berharga", { size: 26, w: 500 }),
    box(435, 130, 330, 130, REDL, RED), t(600, 185, "Ancaman", { size: 34, w: 700 }), t(600, 232, "pihak yang merugikan", { size: 26, w: 500 }),
    box(810, 130, 330, 130, AML, AM), t(975, 185, "Kerentanan", { size: 34, w: 700 }), t(975, 232, "celah yang dipakai", { size: 26, w: 500 }),
    arrow(225, 265, 520, 400), arrow(600, 265, 600, 400), arrow(975, 265, 680, 400),
    box(300, 405, 600, 150, GL, G), t(600, 470, "RISIKO", { size: 40, w: 700 }), t(600, 520, "kemungkinan x dampak", { size: 30, w: 600 }),
    t(600, 640, "Empat respons yang sah", { size: 32, w: 700 }),
    ...["Kurangi", "Hindari", "Pindahkan", "Terima"].flatMap((s, i) => [box(70 + i * 275, 670, 245, 90, i === 3 ? AML : SL, i === 3 ? AM : INK), t(192 + i * 275, 730, s, { size: 32, w: 700 })]),
    box(70, 830, 1060, 110, INK), t(600, 880, "Skor 4 x 5 = 20 dikerjakan dulu,", { size: 30, w: 700, fill: "#fff" }), t(600, 920, "bukan yang paling mudah diperbaiki", { size: 26, w: 500, fill: GL }),
  ].join("")),
  "ks-ancaman": sheet([
    title("Alur serangan dan titik pemutusnya"),
    ...["Pengintaian", "Masuk awal", "Pijakan", "Perluasan", "Tujuan", "Hapus jejak"].flatMap((s, i) => {
      const x = 40 + i * 190;
      return [box(x, 140, 172, 100, i < 3 ? SL : REDL, i < 3 ? INK : RED), t(x + 86, 198, s, { size: 20, w: 700 }), ...(i < 5 ? [arrow(x + 172, 190, x + 190, 190)] : [])];
    }),
    t(600, 330, "Kontrol yang memutus tiap tahap", { size: 32, w: 700 }),
    ...[["Masuk awal", "MFA tahan phishing", "pembaruan sistem"], ["Pijakan", "EDR dan antivirus", "least privilege"], ["Perluasan", "segmentasi jaringan", "akun terpisah"], ["Tujuan", "backup offline teruji", "enkripsi data"], ["Deteksi", "log dipantau", "peringatan ditanggapi"]].flatMap(([h, a, b], i) => {
      const y = 370 + i * 112;
      return [box(60, y, 250, 90, GL, G), t(185, y + 55, h, { size: 28, w: 700 }), box(330, y, 810, 90, "#fff", INK), t(360, y + 40, a, { a: "start", size: 26, w: 600 }), t(360, y + 74, b, { a: "start", size: 24, w: 500, fill: "#475569" })];
    }),
  ].join("")),
  "ks-kripto": sheet([
    title("Empat alat kriptografi"),
    ...[["Hash", "keutuhan", "data -> sidik jari tetap", "satu arah"], ["Simetris", "kerahasiaan", "satu kunci untuk dua arah", "AES"], ["Asimetris", "pertukaran kunci", "kunci publik dan privat", "RSA, kurva eliptik"], ["Tanda tangan", "keutuhan dan asal", "privat menandatangani", "publik memverifikasi"]].flatMap(([h, a, b, c], i) => {
      const x = 50 + (i % 2) * 560, y = 130 + Math.floor(i / 2) * 330;
      return [box(x, y, 540, 300, i % 2 ? GL : SL, i % 2 ? G : INK), t(x + 270, y + 70, h, { size: 38, w: 700 }), t(x + 270, y + 125, a, { size: 28, w: 600, fill: "#475569" }), t(x + 270, y + 200, b, { size: 25, w: 500 }), t(x + 270, y + 250, c, { size: 25, w: 700, fill: G })];
    }),
    box(50, 810, 1100, 140, INK), t(600, 865, "HTTPS = sertifikat memastikan domain,", { size: 30, w: 700, fill: "#fff" }), t(600, 910, "asimetris menyepakati kunci, simetris mengirim data", { size: 26, w: 500, fill: GL }),
  ].join("")),
  "ks-auth": sheet([
    title("Faktor autentikasi dan kekuatan MFA"),
    ...[["Diketahui", "sandi, PIN"], ["Dimiliki", "ponsel, kunci USB"], ["Adalah", "sidik jari, wajah"]].flatMap(([h, a], i) => [box(60 + i * 375, 120, 345, 150, SL), t(232 + i * 375, 185, h, { size: 34, w: 700 }), t(232 + i * 375, 235, a, { size: 25, w: 500 })]),
    t(600, 350, "MFA = faktor dari kategori berbeda", { size: 30, w: 700 }),
    t(600, 440, "Dari yang paling lemah ke paling kuat", { size: 28, w: 600, fill: "#475569" }),
    ...[["Tanpa MFA", 300, REDL, RED], ["SMS", 450, AML, AM], ["Aplikasi TOTP", 650, AML, AM], ["Passkey / kunci keamanan", 1060, GL, G]].flatMap(([s, w, f, st], i) => [box(70, 480 + i * 95, w, 75, f, st), t(100, 530 + i * 95, s, { a: "start", size: 27, w: 700 })]),
    box(70, 880, 1060, 90, INK), t(600, 935, "Passkey terikat ke domain asli, sehingga tak bisa diserahkan ke situs tiruan", { size: 24, w: 600, fill: "#fff" }),
  ].join("")),
  "ks-owasp": sheet([
    title("OWASP Top 10 edisi 2025"),
    ...[["A01", "Broken Access Control"], ["A02", "Security Misconfiguration"], ["A03", "Software Supply Chain"], ["A04", "Cryptographic Failures"], ["A05", "Injection"], ["A06", "Insecure Design"], ["A07", "Authentication Failures"], ["A08", "Software/Data Integrity"], ["A09", "Logging and Alerting"], ["A10", "Exceptional Conditions"]].flatMap(([c, n], i) => {
      const x = 50 + (i % 2) * 560, y = 120 + Math.floor(i / 2) * 165;
      return [box(x, y, 540, 145, i === 0 ? GL : SL, i === 0 ? G : INK), t(x + 30, y + 62, c, { a: "start", size: 36, w: 700, fill: G }), t(x + 30, y + 112, n, { a: "start", size: 27, w: 600 })];
    }),
    t(600, 975, "Kunci utama: jangan percaya input, otorisasi di server", { size: 25, w: 600, fill: "#475569" }),
  ].join("")),
  "ks-zona": sheet([
    title("Zona jaringan dan firewall"),
    box(440, 110, 320, 100, SL), t(600, 172, "Internet", { size: 34, w: 700 }),
    arrow(600, 214, 600, 290),
    box(380, 295, 440, 100, AML, AM), t(600, 358, "Firewall: default deny", { size: 30, w: 700 }),
    arrow(500, 398, 190, 510), arrow(560, 398, 460, 510), arrow(640, 398, 740, 510), arrow(700, 398, 1010, 510),
    ...[["Karyawan", "laptop, ponsel"], ["Server", "aplikasi, data"], ["Tamu", "hanya internet"], ["IoT", "kamera, printer"]].flatMap(([h, a], i) => [box(50 + i * 285, 515, 260, 160, i === 1 ? GL : SL, i === 1 ? G : INK), t(180 + i * 285, 590, h, { size: 32, w: 700 }), t(180 + i * 285, 640, a, { size: 24, w: 500 })]),
    box(50, 740, 1100, 100, REDL, RED), t(600, 802, "Tamu dan IoT tidak punya jalur ke server", { size: 29, w: 700 }),
    box(50, 870, 1100, 90, INK), t(600, 925, "Aturan dibaca dari atas, kecocokan pertama menentukan", { size: 26, w: 600, fill: "#fff" }),
  ].join("")),
  "ks-social": sheet([
    title("Membaca tautan dengan teliti"),
    box(40, 120, 1120, 140, SL), t(600, 205, "https://bank.co.id.masuk-aman.com/login", { size: 36, w: 600, mono: true }),
    box(40, 300, 430, 170, REDL, RED), t(255, 370, "bank.co.id", { size: 34, w: 700, mono: true }), t(255, 420, "hanya subdomain", { size: 26, w: 500 }), t(255, 452, "di depan", { size: 26, w: 500 }),
    box(500, 300, 660, 170, GL, G), t(830, 370, "masuk-aman.com", { size: 34, w: 700, mono: true }), t(830, 420, "domain utama sebenarnya:", { size: 26, w: 500 }), t(830, 452, "pemilik tautan ini", { size: 26, w: 500 }),
    t(600, 550, "Lima pemeriksaan sebelum klik", { size: 32, w: 700 }),
    ...["Siapa pengirim sebenarnya?", "Ke mana tautan mengarah?", "Apa yang diminta?", "Ada tekanan waktu atau rahasia?", "Bisa diverifikasi lewat jalur lain?"].flatMap((s, i) => [box(60, 580 + i * 75, 1080, 62, i % 2 ? "#fff" : SL, INK), t(100, 623 + i * 75, `${i + 1}.  ${s}`, { a: "start", size: 27, w: 600 })]),
    t(600, 980, "OTP dan sandi tidak pernah diminta lembaga yang sah", { size: 24, w: 600, fill: "#475569" }),
  ].join("")),
  "ks-insiden": sheet([
    title("Siklus respons insiden"),
    box(60, 130, 500, 200, SL), t(310, 210, "1. Persiapan", { size: 36, w: 700 }), t(310, 265, "rencana, kontak, backup", { size: 26, w: 500 }),
    box(640, 130, 500, 200, AML, AM), t(890, 210, "2. Deteksi dan analisis", { size: 33, w: 700 }), t(890, 265, "verifikasi, cakupan, keparahan", { size: 26, w: 500 }),
    box(640, 420, 500, 200, REDL, RED), t(890, 500, "3. Tahan dan pulihkan", { size: 33, w: 700 }), t(890, 555, "isolasi, cabut akses, pulih", { size: 26, w: 500 }),
    box(60, 420, 500, 200, GL, G), t(310, 500, "4. Pasca-insiden", { size: 36, w: 700 }), t(310, 555, "belajar tanpa menyalahkan", { size: 26, w: 500 }),
    arrow(565, 230, 635, 230), arrow(890, 335, 890, 415), arrow(635, 520, 565, 520), arrow(310, 415, 310, 335),
    box(60, 690, 1080, 250, INK), t(600, 755, "Menit pertama", { size: 32, w: 700, fill: "#fff" }),
    t(600, 810, "Catat  -  Laporkan  -  Batasi", { size: 30, w: 600, fill: GL }), t(600, 860, "Ganti sandi dari perangkat bersih", { size: 30, w: 600, fill: GL }),
    t(600, 910, "UU PDP: beri tahu paling lambat 3 x 24 jam", { size: 26, w: 500, fill: AML }),
  ].join("")),
};
for (const [name, svg] of Object.entries(D)) await sharp(Buffer.from(svg), { density: 144 }).resize(2400, 2000).png().toFile(join(dir, `${name}.png`));
console.log("assets ->", dir);
