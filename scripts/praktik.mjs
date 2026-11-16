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
  b += text(60, 785, "Di MikroTik:", { size: 24, weight: 800 }) + text(240, 785, "/ip firewall nat add chain=srcnat", { size: 22, weight: 500, mono: true }) + text(240, 817, "    out-interface=ether1 action=masquerade", { size: 22, weight: 500, mono: true });
  return frame("NAT mengganti alamat dan port sumber paket dari jaringan lokal menjadi alamat publik router", 860, b, AH);
}

const DIAGRAMS = {
  "utp-t568a-t568b": gambarUtp,
  "kabel-straight-crossover": gambarStraightCrossover,
  "rj45-konektor": gambarRj45,
  "topologi-dasar": gambarTopologi,
  "osi-tcpip": gambarOsi,
  "dhcp-dora": gambarDhcp,
  "nat-masquerade": gambarNat,
};

mkdirSync("public/praktik", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/praktik/${name}.svg`, draw());
  console.log(name);
}
