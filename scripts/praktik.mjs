// Draws the technical diagrams in public/praktik/ (embedded in chapters with
// ![ket](gambar:nama)). White card, ink line, matcha accents; wire colors are
// real on purpose. Facts live in lib/praktik/ where svg.test.ts pins them.
//
//   node scripts/praktik.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { T568A, T568B, WIRE_HEX } from "../lib/praktik/utp.ts";

export const INK = "#0f100d", M1 = "#e3edc8", M3 = "#b5d36f", PINK = "#f4b6c2";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// A 1200px-wide white card with a title for screen readers.
export function frame(title, height, body, defs = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 ${height}" width="1200" height="${height}" role="img" aria-labelledby="t" font-family="system-ui, 'Segoe UI', Roboto, sans-serif">
<title id="t">${esc(title)}</title>
<defs>${defs}</defs>
<rect x="3" y="3" width="1194" height="${height - 6}" rx="28" fill="#ffffff" stroke="${INK}" stroke-width="4"/>
${body}
</svg>
`;
}
export const text = (x, y, s, { size = 28, weight = 600, anchor = "start", fill = INK } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}">${esc(s)}</text>`;
export const box = (x, y, w, h, { fill = "#ffffff", r = 14, sw = 4 } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
export const line = (x1, y1, x2, y2, { sw = 4, stroke = INK, dash } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
export const circle = (cx, cy, r, { fill = "#ffffff", sw = 4 } = {}) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;

// Solid wires use the hex, striped ones a diagonal pattern (defined once per file).
const wireDefs = Object.entries(WIRE_HEX)
  .map(([n, hex]) => `<pattern id="s-${n}" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="28" height="28" fill="#ffffff"/><rect width="14" height="28" fill="${hex}"/></pattern>`)
  .join("");
const wireFill = (name) => (name.startsWith("putih-") ? `url(#s-${name.slice(6)})` : WIRE_HEX[name]);
const wireLabel = (name, x, y, size = 22) =>
  name.startsWith("putih-")
    ? text(x, y, "putih", { size, anchor: "middle", weight: 500 }) + text(x, y + size + 4, name.slice(6), { size, anchor: "middle", weight: 500 })
    : text(x, y + size / 2, name, { size, anchor: "middle", weight: 500 });

function standardRow(label, order, y) {
  const x0 = 210, gap = 120;
  let s = text(60, y + 150, label, { size: 36, weight: 800 });
  order.forEach((name, i) => {
    const x = x0 + i * gap;
    s += circle(x + 40, y + 14, 22, { fill: M1 });
    s += text(x + 40, y + 24, i + 1, { size: 26, anchor: "middle", weight: 800 });
    s += box(x, y + 50, 80, 220, { fill: wireFill(name), r: 16 });
    s += wireLabel(name, x + 40, y + 305);
  });
  return s;
}

function gambarUtp() {
  const body =
    text(600, 70, "Urutan warna kabel UTP di konektor RJ45", { size: 40, weight: 800, anchor: "middle" }) +
    standardRow("T568B", T568B, 110) +
    standardRow("T568A", T568A, 470) +
    text(600, 880, "Pin dihitung dari kiri ke kanan, kontak emas menghadap kamu dan klip di sisi yang menjauh.", { size: 24, anchor: "middle", weight: 500 }) +
    text(600, 918, "Beda T568A dan T568B hanya pasangan hijau dan oranye yang bertukar: pin 1-2 dengan 3-6.", { size: 24, anchor: "middle", weight: 500 });
  return frame("Urutan warna kabel UTP untuk standar T568A dan T568B, pin 1 sampai 8", 950, body, wireDefs);
}

// Straight and crossover as the pin pairs they connect.
function panel(y, heading, endA, endB, pairs, swapped, note) {
  const xa = 300, xb = 900, top = y + 150, gap = 52;
  let s = text(60, y + 50, heading, { size: 34, weight: 800 });
  s += text(xa, y + 95, `Ujung A: ${endA}`, { size: 26, anchor: "middle" }) + text(xb, y + 95, `Ujung B: ${endB}`, { size: 26, anchor: "middle" });
  pairs.forEach(([a, b]) => {
    const swap = swapped.includes(a);
    s += line(xa + 22, top + (a - 1) * gap, xb - 22, top + (b - 1) * gap, { sw: swap ? 9 : 4, stroke: swap ? M3 : INK });
  });
  for (let p = 1; p <= 8; p++) {
    for (const x of [xa, xb]) {
      s += circle(x, top + (p - 1) * gap, 20, { fill: swapped.includes(p) ? M3 : M1, sw: 3 });
      s += text(x, top + (p - 1) * gap + 9, p, { size: 24, anchor: "middle", weight: 800 });
    }
  }
  s += text(600, y + 585, note, { size: 24, anchor: "middle", weight: 500 });
  return s;
}

function gambarStraightCrossover() {
  const straight = Array.from({ length: 8 }, (_, i) => [i + 1, i + 1]);
  const cross = [[1, 3], [2, 6], [3, 1], [4, 4], [5, 5], [6, 2], [7, 7], [8, 8]];
  const body =
    panel(10, "Straight-through", "T568B", "T568B", straight, [], "Pin sama ke pin sama. Untuk perangkat yang berbeda jenis, misalnya PC ke switch.") +
    panel(660, "Crossover", "T568A", "T568B", cross, [1, 2, 3, 6], "Pin 1-2 bertukar dengan 3-6. Untuk perangkat sejenis, misalnya PC ke PC atau switch ke switch.") +
    text(600, 1325, "Switch dan NIC modern punya Auto-MDI/MDIX, jadi kabel straight biasanya sudah cukup.", { size: 24, anchor: "middle", weight: 500 });
  return frame("Kabel straight-through dan crossover: pin mana terhubung ke pin mana", 1370, body);
}

const FUNGSI = ["TX+", "TX-", "RX+", "tak dipakai", "tak dipakai", "RX-", "tak dipakai", "tak dipakai"];
function gambarRj45() {
  let s = text(600, 70, "Konektor RJ45 dan fungsi tiap pin", { size: 40, weight: 800, anchor: "middle" });
  // The plug seen from the contact side, clip away from you.
  s += box(70, 130, 440, 300, { fill: M1, r: 24 });
  s += box(120, 150, 340, 120, { fill: "#ffffff", r: 12, sw: 3 });
  for (let i = 0; i < 8; i++) {
    const x = 138 + i * 42;
    s += `<rect x="${x}" y="170" width="18" height="80" rx="4" fill="#e9c46a" stroke="${INK}" stroke-width="3"/>`;
    s += text(x + 9, 310, i + 1, { size: 26, anchor: "middle", weight: 800 });
  }
  s += text(140, 360, "pin 1", { size: 26 }) + text(460, 360, "pin 8", { size: 26, anchor: "end" });
  s += text(290, 465, "Kontak emas menghadap kamu,", { size: 24, anchor: "middle", weight: 500 });
  s += text(290, 497, "klip di sisi yang menjauh.", { size: 24, anchor: "middle", weight: 500 });
  // Pin table with T568B colors.
  s += text(620, 150, "Pin", { size: 26, weight: 800 }) + text(720, 150, "Fungsi 10/100", { size: 26, weight: 800 }) + text(980, 150, "T568B", { size: 26, weight: 800 });
  T568B.forEach((name, i) => {
    const y = 195 + i * 56;
    s += text(630, y, i + 1, { size: 26, weight: 800 }) + text(720, y, FUNGSI[i], { size: 26, weight: 500 });
    s += box(960, y - 26, 44, 34, { fill: wireFill(name), r: 8, sw: 3 }) + text(1016, y, name, { size: 22, weight: 500 });
  });
  s += text(600, 690, "Pada 10/100 Mbps hanya pin 1, 2, 3, 6 yang membawa data. Gigabit memakai keempat pasang.", { size: 24, anchor: "middle", weight: 500 });
  return frame("Konektor RJ45 dilihat dari sisi kontak, dengan nomor pin 1 sampai 8 dan fungsinya", 730, s, wireDefs);
}

const DIAGRAMS = {
  "utp-t568a-t568b": gambarUtp,
  "kabel-straight-crossover": gambarStraightCrossover,
  "rj45-konektor": gambarRj45,
};

mkdirSync("public/praktik", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/praktik/${name}.svg`, draw());
  console.log(name);
}
