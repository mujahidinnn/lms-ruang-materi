// Draws the technical diagrams in public/praktik/ (embedded in chapters with
// ![ket](gambar:nama)). White card, ink line, matcha accents; wire colors are
// real on purpose. Facts live in lib/praktik/ where svg.test.ts pins them.
//
//   node scripts/praktik.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { T568A, T568B, WIRE_HEX } from "../lib/praktik/utp.ts";

export const INK = "#0f100d", M1 = "#e3edc8", M3 = "#b5d36f", PINK = "#f4b6c2";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// A 1200px-wide white sheet with a title for screen readers. No border or
// rounded corners of its own: the figure around it draws those.
export function frame(title, height, body, defs = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 ${height}" width="1200" height="${height}" role="img" aria-labelledby="t" font-family="system-ui, 'Segoe UI', Roboto, sans-serif">
<title id="t">${esc(title)}</title>
<defs>${defs}</defs>
<rect width="1200" height="${height}" fill="#ffffff"/>
${body}
</svg>
`;
}
export const text = (x, y, s, { size = 28, weight = 600, anchor = "start", fill = INK, mono = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}"${mono ? ' font-family="ui-monospace, Menlo, Consolas, monospace"' : ""}>${esc(s)}</text>`;
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

// ---- Network concepts ----
const dot = (x, y, r = 18, fill = M1) => circle(x, y, r, { fill, sw: 3 });
const ring = (n, cx, cy, r) => Array.from({ length: n }, (_, k) => [cx + r * Math.cos(((-90 + (360 / n) * k) * Math.PI) / 180), cy + r * Math.sin(((-90 + (360 / n) * k) * Math.PI) / 180)]);

function topoPanel(x, y, title, sub, draw) {
  const cx = x + 180, cy = y + 172;
  return box(x, y, 360, 370, { r: 22 }) +
    text(cx, y + 48, title, { size: 32, weight: 800, anchor: "middle" }) +
    draw(cx, cy) +
    sub.map((l, i) => text(cx, y + 318 + i * 28, l, { size: 21, weight: 500, anchor: "middle" })).join("");
}

function gambarTopologi() {
  const star = (cx, cy) => {
    const pts = ring(5, cx, cy, 78);
    return pts.map(([px, py]) => line(cx, cy, px, py)).join("") + box(cx - 34, cy - 20, 68, 40, { fill: M3, r: 10, sw: 3 }) + pts.map(([px, py]) => dot(px, py)).join("");
  };
  const bus = (cx, cy) => {
    let s = line(cx - 150, cy, cx + 150, cy, { sw: 9 }) + box(cx - 162, cy - 18, 12, 36, { fill: INK, r: 3, sw: 2 }) + box(cx + 150, cy - 18, 12, 36, { fill: INK, r: 3, sw: 2 });
    for (let i = 0; i < 5; i++) {
      const px = cx - 108 + i * 54, up = i % 2 === 0, py = cy + (up ? -62 : 62);
      s += line(px, cy, px, py) + dot(px, py);
    }
    return s;
  };
  const ringT = (cx, cy) => {
    const pts = ring(6, cx, cy, 78);
    return pts.map(([px, py], i) => { const [qx, qy] = pts[(i + 1) % 6]; return line(px, py, qx, qy, { sw: 5 }); }).join("") + pts.map(([px, py]) => dot(px, py)).join("");
  };
  const mesh = (cx, cy) => {
    const pts = ring(5, cx, cy, 78);
    let s = "";
    for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) s += line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], { sw: 3 });
    return s + pts.map(([px, py]) => dot(px, py)).join("");
  };
  const tree = (cx, cy) => {
    const root = [cx, cy - 80], kids = [[cx - 80, cy], [cx + 80, cy]], leaves = [[cx - 120, cy + 80], [cx - 40, cy + 80], [cx + 40, cy + 80], [cx + 120, cy + 80]];
    let s = kids.map(([kx, ky]) => line(root[0], root[1], kx, ky)).join("") + leaves.map(([lx, ly], i) => line(kids[i >> 1][0], kids[i >> 1][1], lx, ly)).join("");
    return s + dot(root[0], root[1], 18, M3) + kids.map(([kx, ky]) => dot(kx, ky)).join("") + leaves.map(([lx, ly]) => dot(lx, ly, 14)).join("");
  };
  const info = box(800, 490, 360, 370, { fill: M1, r: 22 }) +
    text(980, 545, "Jumlah link mesh penuh", { size: 27, weight: 800, anchor: "middle" }) +
    text(980, 625, "n x (n - 1) / 2", { size: 38, weight: 800, anchor: "middle" }) +
    text(980, 695, "5 perangkat: 5 x 4 / 2 = 10 link", { size: 24, weight: 500, anchor: "middle" }) +
    text(980, 735, "10 perangkat: 45 link", { size: 24, weight: 500, anchor: "middle" }) +
    text(980, 805, "Link naik jauh lebih cepat", { size: 22, weight: 500, anchor: "middle" }) +
    text(980, 833, "daripada jumlah perangkat.", { size: 22, weight: 500, anchor: "middle" });
  const body = text(600, 62, "Topologi jaringan dasar", { size: 42, weight: 800, anchor: "middle" }) +
    topoPanel(40, 100, "Star", ["Semua terhubung ke satu switch.", "Switch mati, semua putus."], star) +
    topoPanel(420, 100, "Bus", ["Satu kabel utama dipakai bersama.", "Kabel utama putus, semua ikut."], bus) +
    topoPanel(800, 100, "Ring", ["Perangkat tersambung melingkar.", "Satu link putus, jalur bisa putus."], ringT) +
    topoPanel(40, 490, "Mesh penuh", ["Setiap perangkat ke semua lainnya.", "Paling andal, paling mahal."], mesh) +
    topoPanel(420, 490, "Tree", ["Hierarki bertingkat dari root.", "Root bermasalah, dampaknya luas."], tree) +
    info;
  return frame("Lima topologi jaringan dasar: star, bus, ring, mesh penuh, dan tree, dengan rumus jumlah link mesh penuh", 900, body);
}

function gambarOsi() {
  const layers = [["7", "Application"], ["6", "Presentation"], ["5", "Session"], ["4", "Transport"], ["3", "Network"], ["2", "Data Link"], ["1", "Physical"]];
  const pdu = { 7: "Data", 6: "Data", 5: "Data", 4: "Segmen / datagram", 3: "Paket", 2: "Frame", 1: "Bit" };
  const contoh = { 7: "HTTP, DNS, SSH", 6: "TLS, enkripsi, JPEG", 5: "Mengelola sesi", 4: "TCP, UDP, nomor port", 3: "IP, router", 2: "Ethernet, MAC, switch", 1: "Kabel, sinyal, hub" };
  const y = (n) => 130 + (7 - n) * 100;
  let b = text(600, 62, "Model OSI dan TCP/IP", { size: 42, weight: 800, anchor: "middle" });
  b += text(170, 112, "TCP/IP", { size: 26, weight: 800, anchor: "middle" }) + text(495, 112, "OSI", { size: 26, weight: 800, anchor: "middle" }) +
    text(765, 112, "Unit data", { size: 26, weight: 800, anchor: "middle" }) + text(1020, 112, "Contoh", { size: 26, weight: 800, anchor: "middle" });
  [[7, 5, "Application", M3], [4, 4, "Transport", M1], [3, 3, "Internet", M1], [2, 1, "Network Access", M1]].forEach(([from, to, name, fill]) => {
    const top = y(from), h = y(to) + 88 - top;
    b += box(40, top, 260, h, { fill, r: 18 }) + text(170, top + h / 2 + 10, name, { size: 28, weight: 800, anchor: "middle" });
  });
  layers.forEach(([n, name]) => {
    const k = Number(n);
    b += box(330, y(k), 330, 88, { r: 14 }) + circle(375, y(k) + 44, 22, { fill: M1 }) + text(375, y(k) + 54, n, { size: 26, weight: 800, anchor: "middle" }) + text(410, y(k) + 54, name, { size: 28 });
    b += text(765, y(k) + 54, pdu[k], { size: k === 4 ? 21 : 26, weight: 600, anchor: "middle" }) + text(1020, y(k) + 52, contoh[k], { size: 22, weight: 500, anchor: "middle" });
  });
  b += text(600, 880, "Data turun dari lapisan 7 ke 1 di pengirim, lalu naik dari 1 ke 7 di penerima.", { size: 24, anchor: "middle", weight: 500 });
  b += text(600, 916, "Setiap lapisan menambah header: itu enkapsulasi. Penerima melepasnya: dekapsulasi.", { size: 24, anchor: "middle", weight: 500 });
  return frame("Tujuh lapisan model OSI dipetakan ke empat lapisan TCP/IP, dengan unit data dan contoh tiap lapisan", 960, b);
}

const AH = '<marker id="ah" markerWidth="14" markerHeight="14" refX="11" refY="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L14 7L0 14z" fill="#0f100d"/></marker>';
const arrow = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="5" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""} marker-end="url(#ah)"/>`;

function gambarDhcp() {
  const L = 260, R = 940;
  let b = text(600, 62, "Proses DHCP: DORA", { size: 42, weight: 800, anchor: "middle" });
  b += box(L - 130, 90, 260, 70, { fill: M3, r: 16 }) + text(L, 135, "Klien (laptop)", { size: 28, anchor: "middle", weight: 800 });
  b += box(R - 130, 90, 260, 70, { fill: M3, r: 16 }) + text(R, 135, "Server DHCP", { size: 28, anchor: "middle", weight: 800 });
  b += line(L, 160, L, 720, { sw: 4, dash: "3 14" }) + line(R, 160, R, 720, { sw: 4, dash: "3 14" });
  const steps = [
    ["1", "Discover", "Ada server DHCP di sini? (broadcast)", true],
    ["2", "Offer", "Pakai 192.168.1.50, sewa 24 jam", false],
    ["3", "Request", "Baik, saya ambil 192.168.1.50", true],
    ["4", "Acknowledge", "Disetujui. Alamat sudah milikmu", false],
  ];
  steps.forEach(([n, name, desc, toServer], i) => {
    const yy = 265 + i * 130;
    b += toServer ? arrow(L + 8, yy, R - 12, yy) : arrow(R - 8, yy, L + 12, yy);
    b += circle(600, yy - 52, 22, { fill: M1 }) + text(600, yy - 42, n, { size: 26, anchor: "middle", weight: 800 });
    b += text(640, yy - 42, name, { size: 30, weight: 800 }) + text(600, yy + 36, desc, { size: 24, anchor: "middle", weight: 500 });
  });
  b += text(600, 775, "DORA = Discover, Offer, Request, Acknowledge.", { size: 26, anchor: "middle", weight: 800 });
  b += text(600, 813, "Pesan memakai UDP: klien di port 68, server di port 67.", { size: 24, anchor: "middle", weight: 500 });
  b += text(600, 847, "Discover berupa broadcast karena klien belum punya alamat IP.", { size: 24, anchor: "middle", weight: 500 });
  return frame("Empat langkah DHCP: Discover, Offer, Request, Acknowledge antara klien dan server", 885, b, AH);
}

function gambarNat() {
  let b = text(600, 62, "NAT: satu alamat publik untuk banyak perangkat", { size: 38, weight: 800, anchor: "middle" });
  b += box(40, 110, 290, 140, { fill: M1, r: 18 }) + text(185, 160, "Laptop", { size: 28, weight: 800, anchor: "middle" }) + text(185, 200, "192.168.1.10", { size: 26, anchor: "middle", weight: 500 }) + text(185, 232, "port 5000", { size: 22, anchor: "middle", weight: 500 });
  b += box(455, 110, 290, 140, { fill: M3, r: 18 }) + text(600, 160, "Router NAT", { size: 28, weight: 800, anchor: "middle" }) + text(600, 198, "LAN 192.168.1.1", { size: 24, anchor: "middle", weight: 500 }) + text(600, 230, "WAN 203.0.113.5", { size: 24, anchor: "middle", weight: 500 });
  b += box(870, 110, 290, 140, { fill: M1, r: 18 }) + text(1015, 160, "Server web", { size: 28, weight: 800, anchor: "middle" }) + text(1015, 200, "198.51.100.20", { size: 26, anchor: "middle", weight: 500 }) + text(1015, 232, "port 443", { size: 22, anchor: "middle", weight: 500 });
  b += arrow(334, 150, 450, 150) + arrow(749, 150, 865, 150) + arrow(865, 215, 749, 215, { dash: "10 8" }) + arrow(450, 215, 334, 215, { dash: "10 8" });
  [[392, 126, "1"], [807, 126, "2"], [807, 191, "3"], [392, 191, "4"]].forEach(([x, y, n]) => { b += circle(x, y, 17, { fill: "#ffffff", sw: 3 }) + text(x, y + 8, n, { size: 22, anchor: "middle", weight: 800 }); });
  const rows = [
    ["1", "Keluar dari laptop", "sumber 192.168.1.10:5000  ke  198.51.100.20:443"],
    ["2", "Setelah NAT", "sumber 203.0.113.5:40000  ke  198.51.100.20:443"],
    ["3", "Balasan server", "dari 198.51.100.20:443  ke  203.0.113.5:40000"],
    ["4", "Diterjemahkan balik", "dari 198.51.100.20:443  ke  192.168.1.10:5000"],
  ];
  rows.forEach(([n, head, detail], i) => {
    const y = 300 + i * 82;
    b += box(40, y, 1120, 66, { r: 14 }) + circle(80, y + 33, 20, { fill: M1 }) + text(80, y + 42, n, { size: 24, anchor: "middle", weight: 800 });
    b += text(120, y + 43, head, { size: 26, weight: 800 }) + text(430, y + 43, detail, { size: 25, weight: 500, mono: true });
  });
  b += box(40, 640, 1120, 90, { fill: M1, r: 14 }) + text(70, 678, "Tabel terjemahan di router", { size: 24, weight: 800 }) + text(70, 712, "192.168.1.10:5000  <->  203.0.113.5:40000", { size: 26, weight: 500, mono: true });
  b += text(60, 785, "Di MikroTik:", { size: 24, weight: 800 }) + text(240, 785, "/ip firewall nat add chain=srcnat \\", { size: 22, weight: 500, mono: true }) + text(240, 817, "    out-interface=ether1 action=masquerade", { size: 22, weight: 500, mono: true });
  return frame("NAT mengganti alamat dan port sumber paket dari jaringan lokal menjadi alamat publik router", 860, b, AH);
}

// ---- Hardware ----
const squares = (x, y, n, w, gap, h = w, fill = "#ffffff") => Array.from({ length: n }, (_, i) => `<rect x="${x + i * (w + gap)}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="${INK}" stroke-width="2.5"/>`).join("");
const led = (x, y, fill = M3) => circle(x, y, 6, { fill, sw: 2 });

function gambarRak() {
  const U = 68, top = 130, x = 215, w = 450;
  const ru = (n) => top + (10 - n) * U; // top edge of unit n (10 = top)
  let b = text(600, 62, "Rak jaringan (rack 19 inci)", { size: 42, weight: 800, anchor: "middle" });
  b += box(180, top - 20, 520, 10 * U + 40, { fill: "#f1f1ec", r: 18 });
  for (let n = 1; n <= 10; n++) b += text(160, ru(n) + U / 2 + 8, `U${n}`, { size: 20, anchor: "end", weight: 500 });
  for (const rx of [195, 676]) for (let n = 0; n < 10; n++) b += circle(rx, top + n * U + U / 2, 5, { sw: 2 });
  // U10 patch panel, U9 switch, U8 cable manager, U7 router, U6-U5 server, U4 empty, U3-U1 UPS
  const dev = (n, units, fill, inner) => box(x, ru(n) + 4, w, units * U - 8, { fill, r: 8, sw: 3 }) + inner;
  b += dev(10, 1, "#ffffff", squares(x + 16, ru(10) + 24, 24, 13, 4, 18));
  b += dev(9, 1, M1, squares(x + 14, ru(9) + 16, 12, 22, 6, 16) + squares(x + 14, ru(9) + 38, 12, 22, 6, 16) + squares(x + 378, ru(9) + 16, 2, 26, 6, 38, M3));
  b += `<rect x="${x}" y="${ru(8) + 10}" width="${w}" height="${U - 20}" rx="6" fill="#ffffff" stroke="${INK}" stroke-width="2.5" stroke-dasharray="8 6"/>` + text(x + w / 2, ru(8) + 42, "pengatur kabel", { size: 20, anchor: "middle", weight: 500 });
  b += dev(7, 1, M3, squares(x + 24, ru(7) + 22, 5, 36, 10, 26) + led(x + 330, ru(7) + 34) + led(x + 360, ru(7) + 34) + text(x + 410, ru(7) + 42, "router", { size: 22, anchor: "middle" }));
  b += dev(6, 2, "#ffffff", squares(x + 24, ru(6) + 22, 4, 80, 10, 40) + squares(x + 24, ru(6) + 76, 4, 80, 10, 40) + led(x + 410, ru(6) + 40) + led(x + 410, ru(6) + 70, "#ffffff"));
  b += dev(3, 3, INK, text(x + w / 2, ru(3) + 112, "UPS", { size: 40, anchor: "middle", fill: "#ffffff", weight: 800 }) + squares(x + 150, ru(3) + 140, 5, 30, 8, 12, M3));
  // labels
  const lab = (n, units, head, lines) => {
    const yy = ru(n) + (units * U) / 2;
    return line(666, yy, 745, yy, { sw: 3 }) + text(760, yy - 6, head, { size: 27, weight: 800 }) + lines.map((l, i) => text(760, yy + 24 + i * 28, l, { size: 22, weight: 500 })).join("");
  };
  b += lab(10, 1, "Patch panel", ["Ujung kabel dari dinding dan lantai"]);
  b += lab(9, 1, "Switch", ["Hubungkan perangkat satu jaringan"]);
  b += lab(7, 1, "Router", ["Ke jaringan lain dan ISP"]);
  b += lab(6, 2, "Server", ["Berat, ditaruh rendah"]);
  b += lab(3, 3, "UPS", ["Listrik cadangan, paling berat,", "paling bawah"]);
  b += text(600, 905, "Perangkat jaringan di atas, yang berat di bawah. 1U = 4,45 cm tinggi.", { size: 24, anchor: "middle", weight: 500 });
  b += text(600, 941, "Kabel patch pendek dari patch panel ke switch menjaga rak tetap rapi.", { size: 24, anchor: "middle", weight: 500 });
  return frame("Rak jaringan 10U tampak depan: patch panel, switch, router, server, dan UPS dari atas ke bawah", 985, b);
}

function gambarRouter() {
  let b = text(600, 62, "Router 5 port (contoh umum)", { size: 42, weight: 800, anchor: "middle" });
  b += box(50, 230, 1100, 170, { fill: "#e9e9e2", r: 26 });
  // power jack, five ports, USB, reset
  b += circle(130, 315, 32, { fill: "#ffffff" }) + circle(130, 315, 12, { fill: INK });
  const ports = [["ether1", M3], ["ether2", "#ffffff"], ["ether3", "#ffffff"], ["ether4", "#ffffff"], ["ether5", "#ffffff"]];
  ports.forEach(([name, fill], i) => {
    const px = 240 + i * 135;
    b += box(px, 270, 90, 90, { fill, r: 8, sw: 4 }) + squares(px + 12, 346, 8, 6, 2.5, 8, INK) + led(px + 20, 288) + led(px + 70, 288, "#ffffff") + text(px + 45, 427 + 0, name, { size: 24, anchor: "middle", weight: 800 });
  });
  b += box(930, 280, 90, 50, { r: 6, sw: 4 }) + text(975, 360, "USB", { size: 22, anchor: "middle", weight: 500 });
  b += circle(1085, 300, 14, { fill: INK }) + text(1085, 345, "reset", { size: 20, anchor: "middle", weight: 500 });
  // callouts above
  const call = (x1, x2, y, label) => line(x1, 232, x1, y, { sw: 3 }) + line(x1, y, x2, y, { sw: 3 }) + text((x1 + x2) / 2, y - 14, label, { size: 24, anchor: "middle", weight: 800 });
  b += line(130, 232, 130, 150, { sw: 3 }) + text(130, 132, "Daya", { size: 24, anchor: "middle", weight: 800 });
  b += line(285, 232, 285, 200, { sw: 3 }) + text(285, 150, "WAN", { size: 24, anchor: "middle", weight: 800 }) + text(285, 182, "ke ISP / modem", { size: 21, anchor: "middle", weight: 500 });
  b += line(420, 232, 420, 175, { sw: 3 }) + line(420, 175, 825, 175, { sw: 3 }) + line(825, 175, 825, 232, { sw: 3 });
  b += text(622, 160, "LAN (ether2 sampai ether5)", { size: 24, anchor: "middle", weight: 800 }) + text(622, 205, "ke switch, PC, atau access point", { size: 21, anchor: "middle", weight: 500 });
  b += text(60, 500, "Konfigurasi bawaan MikroTik yang umum:", { size: 26, weight: 800 });
  b += text(60, 545, "ether1 = WAN (meminta IP lewat DHCP dari ISP, dengan NAT masquerade)", { size: 24, weight: 500 });
  b += text(60, 580, "ether2 sampai ether5 = LAN, alamat router 192.168.88.1/24, DHCP aktif", { size: 24, weight: 500 });
  b += text(60, 615, "Tombol reset mengembalikan ke konfigurasi awal. Lampu hijau menyala saat kabel terhubung.", { size: 24, weight: 500 });
  return frame("Router 5 port tampak panel: port daya, ether1 sebagai WAN, ether2 sampai ether5 sebagai LAN, USB, dan tombol reset", 665, b);
}

function gambarKantor() {
  const cx = 330;
  const node = (x, y, w, h, title, sub, fill = "#ffffff") => box(x - w / 2, y, w, h, { fill, r: 16 }) + text(x, y + (sub ? 34 : h / 2 + 9), title, { size: 26, weight: 800, anchor: "middle" }) + (sub ? text(x, y + 63, sub, { size: 20, weight: 500, anchor: "middle", mono: true }) : "");
  let b = text(600, 62, "Jaringan kantor kecil dengan MikroTik", { size: 42, weight: 800, anchor: "middle" });
  b += `<path d="M240 178 C195 178 195 126 240 126 C240 84 300 78 322 110 C345 78 412 94 410 132 C456 132 456 178 410 178 Z" fill="#ffffff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` + text(cx, 160, "Internet", { size: 28, weight: 800, anchor: "middle" });
  b += line(cx, 180, cx, 215) + node(cx, 215, 260, 80, "Modem ISP", "");
  b += line(cx, 295, cx, 340) + text(cx + 18, 325, "ether1 (WAN)", { size: 20, weight: 500 });
  b += node(cx, 340, 340, 100, "Router MikroTik", "WAN 203.0.113.5", M3);
  b += line(cx, 440, cx, 505) + text(cx + 18, 480, "ether2: 192.168.88.1", { size: 20, weight: 500 });
  b += node(cx, 505, 320, 80, "Switch", "");
  [[100, "PC 1", "192.168.88.10"], [275, "PC 2", "192.168.88.11"], [450, "Printer", "192.168.88.20"], [625, "AP Wi-Fi", ""]].forEach(([x, name, ip]) => {
    b += line(cx, 585, x, 650) + node(x, 650, 160, 80, name, ip);
  });
  b += line(625, 730, 625, 790, { sw: 3, dash: "3 10" }) + `<path d="M590 768q35-34 70 0M603 756q22-22 44 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` + node(625, 790, 220, 70, "Laptop dan HP", "");
  b += box(760, 110, 400, 470, { fill: M1, r: 22 });
  b += text(960, 160, "Rencana alamat", { size: 30, weight: 800, anchor: "middle" });
  [["Jaringan LAN", "192.168.88.0/24"], ["Gateway (ether2)", "192.168.88.1"], ["Pool DHCP", "192.168.88.100-200"], ["IP WAN (ether1)", "203.0.113.5"]].forEach(([k, v], i) => {
    b += text(790, 215 + i * 78, k, { size: 22, weight: 800 }) + text(790, 247 + i * 78, v, { size: 22, weight: 500, mono: true });
  });
  b += text(960, 545, "Proyek: atur IP, DHCP, NAT, uji ping", { size: 21, weight: 500, anchor: "middle" });
  b += text(600, 905, "ether1 ke modem (WAN), ether2 ke switch (LAN).", { size: 23, anchor: "middle", weight: 500 });
  b += text(600, 938, "Semua perangkat kantor memakai router sebagai gateway.", { size: 23, anchor: "middle", weight: 500 });
  return frame("Topologi kantor kecil: internet, modem ISP, router MikroTik, switch, PC, printer, access point, laptop dan HP, dengan rencana alamat IP", 975, b);
}

// ---- MikroTik concepts ----
const S = (o = {}) => ({ size: 22, weight: 500, ...o });

function gambarFirewall() {
  const mid = (x, y, w, h, name, sub, fill = "#ffffff") =>
    box(x, y, w, h, { fill, r: 14 }) + text(x + w / 2, y + 36, name, { size: 28, weight: 800, anchor: "middle" }) + text(x + w / 2, y + 64, sub, S({ anchor: "middle" }));
  let b = text(600, 62, "Jalur paket di firewall MikroTik", { size: 42, weight: 800, anchor: "middle" });
  b += box(40, 235, 150, 80, { fill: M1, r: 14 }) + text(115, 268, "Paket", { size: 26, weight: 800, anchor: "middle" }) + text(115, 298, "masuk", { size: 26, weight: 800, anchor: "middle" });
  b += mid(225, 235, 190, 80, "prerouting", "dst-nat", M3);
  b += arrow(194, 275, 221, 275) + arrow(419, 275, 436, 275);
  b += `<polygon points="540,195 645,275 540,355 435,275" fill="#ffffff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  b += text(540, 268, "Tujuan:", { size: 24, weight: 800, anchor: "middle" }) + text(540, 298, "router?", { size: 24, weight: 800, anchor: "middle" });
  // yes: input -> local process -> output
  b += line(540, 195, 540, 180) + arrow(540, 180, 636, 180) + text(560, 166, "Ya", { size: 24, weight: 800 });
  b += mid(640, 140, 140, 80, "input", "ke router") + arrow(784, 180, 811, 180);
  b += box(815, 140, 170, 80, { fill: M1, r: 14 }) + text(900, 175, "Proses di", { size: 24, weight: 800, anchor: "middle" }) + text(900, 205, "router", { size: 24, weight: 800, anchor: "middle" });
  b += arrow(989, 180, 1016, 180);
  b += mid(1020, 140, 140, 80, "output", "dari router");
  // no: forward
  b += line(540, 355, 540, 370) + arrow(540, 370, 636, 370) + text(560, 410, "Tidak", { size: 24, weight: 800 });
  b += mid(640, 330, 180, 80, "forward", "melewati router");
  b += line(824, 370, 1090, 370);
  // merge to postrouting
  b += arrow(1090, 224, 1090, 466);
  b += mid(960, 470, 200, 80, "postrouting", "src-nat", M3) + arrow(956, 510, 884, 510);
  b += box(640, 470, 240, 80, { fill: M1, r: 14 }) + text(760, 520, "Paket keluar", { size: 26, weight: 800, anchor: "middle" });
  b += text(40, 480, "Dst-nat dikerjakan sebelum", S()) + text(40, 508, "keputusan routing, src-nat", S()) + text(40, 536, "sesudahnya.", S());
  // connection tracking
  b += text(40, 625, "Status koneksi (connection tracking)", { size: 30, weight: 800 });
  [["established", "bagian dari koneksi yang sudah berjalan", "#ffffff"], ["related", "terkait koneksi lain, mis. error ICMP", "#ffffff"], ["new", "paket pertama yang memulai koneksi", "#ffffff"], ["invalid", "tidak dikenali, biasanya di-drop", PINK]].forEach(([n, d, f], i) => {
    const x = 40 + (i % 2) * 570, y = 650 + Math.floor(i / 2) * 105;
    b += box(x, y, 550, 90, { fill: f, r: 14 }) + text(x + 24, y + 38, n, { size: 26, weight: 800, mono: true }) + text(x + 24, y + 70, d, S());
  });
  b += text(600, 905, "Paket tujuan router lewat input. Paket yang melewati router lewat forward.", { size: 24, anchor: "middle", weight: 500 });
  b += text(600, 941, "Paket buatan router sendiri keluar lewat output.", { size: 24, anchor: "middle", weight: 500 });
  return frame("Jalur paket di firewall MikroTik: prerouting, keputusan tujuan router, input atau forward, output, postrouting, dan status koneksi", 985, b, AH);
}

function gambarBridgeRouter() {
  const panel = (ox, head, sub, devName, devSub, nets, bullets) => {
    const cx = ox + 270;
    let s = box(ox, 100, 540, 770, { r: 22 }) + text(cx, 160, head, { size: 36, weight: 800, anchor: "middle" }) + text(cx, 198, sub, S({ anchor: "middle", size: 24 }));
    s += box(cx - 140, 250, 280, 130, { fill: M3, r: 16 }) + text(cx, 292, devName, { size: 28, weight: 800, anchor: "middle" });
    const tags = [cx - 70, cx + 70];
    tags.forEach((tx, i) => { s += box(tx - 55, 314, 110, 44, { fill: "#ffffff", r: 10, sw: 3 }) + text(tx, 345, `ether${i + 2}`, { size: 22, weight: 700, anchor: "middle" }); });
    nets.forEach(([n1, n2], i) => {
      const nx = ox + 30 + i * 260;
      s += line(tags[i], 380, nx + 110, 480) + box(nx, 480, 220, 100, { fill: M1, r: 14 }) + text(nx + 110, 520, n1, { size: 26, weight: 800, anchor: "middle" }) + text(nx + 110, 556, n2, S({ anchor: "middle", mono: !!n2 && n2.includes(".") }));
    });
    bullets.forEach((t, i) => { s += circle(ox + 36, 640 + i * 52 - 8, 8, { fill: M3, sw: 3 }) + text(ox + 60, 640 + i * 52, t, { size: 23, weight: 500 }); });
    return s;
  };
  let b = text(600, 62, "Bridge dan router: apa bedanya", { size: 42, weight: 800, anchor: "middle" });
  b += panel(40, "Bridge", "Lapis 2 (Data Link)", "bridge1", "", [["PC A", "MAC A"], ["PC B", "MAC B"]],
    ["Meneruskan frame lewat alamat MAC", "Satu segmen, satu subnet IP", "Port ether2 dan ether3 jadi satu", "Cara kerjanya mirip switch"]);
  b += panel(620, "Router", "Lapis 3 (Network)", "Router", "", [["Jaringan A", "192.168.88.0/24"], ["Jaringan B", "192.168.99.0/24"]],
    ["Meneruskan paket lewat alamat IP", "Menghubungkan dua jaringan", "Tiap port punya IP dan subnet sendiri", "Memilih jalur dari tabel rute"]);
  b += text(60, 915, "Di MikroTik:", { size: 24, weight: 800 }) + text(240, 915, "/interface bridge add name=bridge1", S({ mono: true }));
  b += text(240, 950, "/interface bridge port add bridge=bridge1 interface=ether2", S({ mono: true }));
  return frame("Bridge bekerja di lapis 2 dengan alamat MAC dalam satu segmen, router bekerja di lapis 3 antar jaringan dengan alamat IP dan rute", 990, b);
}

function gambarQueue() {
  let b = text(600, 62, "Simple queue: batas kecepatan per target", { size: 40, weight: 800, anchor: "middle" });
  b += box(380, 120, 440, 350, { fill: M1, r: 22 }) + text(600, 170, "Simple queue", { size: 30, weight: 800, anchor: "middle" });
  b += box(40, 190, 260, 220, { fill: M3, r: 18 }) + text(170, 245, "Target", { size: 30, weight: 800, anchor: "middle" }) + text(170, 288, "192.168.88.0/24", S({ anchor: "middle", mono: true })) + text(170, 326, "PC, laptop, HP", S({ anchor: "middle" }));
  b += box(900, 190, 260, 220, { fill: "#ffffff", r: 18 }) + text(1030, 245, "Internet", { size: 30, weight: 800, anchor: "middle" });
  b += arrow(304, 270, 896, 270) + text(600, 238, "Unggah: max-limit 5M", { size: 26, weight: 800, anchor: "middle" }) + text(600, 306, "dari target ke internet", S({ anchor: "middle" }));
  b += `${arrow(896, 390, 304, 390)}` + text(600, 358, "Unduh: max-limit 10M", { size: 26, weight: 800, anchor: "middle" }) + text(600, 436, "dari internet ke target", S({ anchor: "middle" }));
  [["max-limit", "Batas atas kecepatan,", "format unggah/unduh."], ["limit-at (opsi)", "Kecepatan yang dijamin", "untuk target."], ["burst (opsi)", "Boleh melewati max-limit", "untuk waktu singkat."]].forEach(([n, l1, l2], i) => {
    const x = 40 + i * 390;
    b += box(x, 510, 340, 150, { r: 14 }) + text(x + 24, 554, n, { size: 26, weight: 800, mono: true }) + text(x + 24, 598, l1, S()) + text(x + 24, 628, l2, S());
  });
  b += text(60, 725, "Di MikroTik:", { size: 24, weight: 800 }) + text(240, 725, "/queue simple add name=kantor \\", S({ mono: true })) + text(240, 757, "    target=192.168.88.0/24 max-limit=5M/10M", S({ mono: true }));
  b += text(600, 815, "Angka pertama pada max-limit adalah unggah, angka kedua unduh.", { size: 24, anchor: "middle", weight: 500 });
  return frame("Simple queue dengan target 192.168.88.0/24 dan max-limit unggah 5M, unduh 10M, serta opsi limit-at dan burst", 860, b, AH);
}

function gambarPpp() {
  const end = (x, name, a, c) => box(x, 150, 270, 160, { fill: M3, r: 18 }) + text(x + 135, 200, name, { size: 32, weight: 800, anchor: "middle" }) + text(x + 135, 240, a, S({ anchor: "middle" })) + text(x + 135, 276, c, S({ anchor: "middle", mono: true }));
  let b = text(600, 62, "Terowongan PPP antara klien dan server", { size: 40, weight: 800, anchor: "middle" });
  b += end(40, "Klien", "laptop di rumah", "10.10.10.2") + end(890, "Server", "router kantor", "10.10.10.1");
  b += box(330, 180, 540, 100, { fill: M1, r: 50 }) + text(600, 242, "PPTP / SSTP (lewat internet)", { size: 28, weight: 800, anchor: "middle" });
  b += line(310, 230, 330, 230) + line(870, 230, 890, 230) + text(600, 162, "terowongan lewat jaringan", S({ anchor: "middle", size: 24 }));
  [["PPPoE", ["Lapis 2, di atas ethernet.", "Butuh interface dan", "service-name.", "Hanya dalam satu ethernet,", "bukan lewat internet."]], ["PPTP", ["Di atas IP.", "Sudah tua, keamanannya", "lemah."]], ["SSTP", ["Di atas IP, dibungkus", "TLS (SSL)."]]].forEach(([n, ls], i) => {
    const x = 40 + i * 390;
    b += box(x, 360, 340, 240, { r: 14 }) + text(x + 24, 406, n, { size: 30, weight: 800 }) + ls.map((l, j) => text(x + 24, 446 + j * 30, l, S())).join("");
  });
  b += text(40, 665, "Di sisi server", { size: 30, weight: 800 });
  [["PPP secret", "Nama user dan password", "untuk tiap klien."], ["PPP profile", "Aturan sesi: alamat lokal,", "pool, dan batas."], ["Pool alamat", "Daftar IP yang dibagikan", "ke klien."]].forEach(([n, l1, l2], i) => {
    const x = 40 + i * 390;
    b += box(x, 695, 340, 130, { fill: i === 2 ? M1 : "#ffffff", r: 14 }) + text(x + 24, 739, n, { size: 28, weight: 800 }) + text(x + 24, 774, l1, S()) + text(x + 24, 804, l2, S());
    if (i < 2) b += arrow(x + 344, 760, x + 386, 760);
  });
  b += text(600, 885, "Klien masuk dengan user dan password dari PPP secret.", { size: 24, anchor: "middle", weight: 500 });
  b += text(600, 921, "Server memberi klien alamat dari pool lewat PPP profile.", { size: 24, anchor: "middle", weight: 500 });
  return frame("Terowongan PPP: klien di rumah menyambung ke server di kantor lewat PPPoE, PPTP, atau SSTP, dengan PPP secret, PPP profile, dan pool alamat", 960, b, AH);
}

const DIAGRAMS = {
  "utp-t568a-t568b": gambarUtp,
  "kabel-straight-crossover": gambarStraightCrossover,
  "rj45-konektor": gambarRj45,
  "topologi-dasar": gambarTopologi,
  "osi-tcpip": gambarOsi,
  "dhcp-dora": gambarDhcp,
  "nat-masquerade": gambarNat,
  "rak-jaringan": gambarRak,
  "router-5-port": gambarRouter,
  "kantor-kecil-mikrotik": gambarKantor,
  "firewall-chain-flow": gambarFirewall,
  "bridge-vs-router": gambarBridgeRouter,
  "queue-simple-limit": gambarQueue,
  "ppp-tunnel": gambarPpp,
};

mkdirSync("public/praktik", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/praktik/${name}.svg`, draw());
  console.log(name);
}
