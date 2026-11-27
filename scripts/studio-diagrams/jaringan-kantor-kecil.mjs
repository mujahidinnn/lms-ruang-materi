// Diagrams for Studio Proyek "jaringan-kantor-kecil", same look as scripts/praktik.mjs.
//   node scripts/studio-diagrams/jaringan-kantor-kecil.mjs
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
const box = (x, y, w, h, { fill = "#ffffff", r = 14, sw = 4 } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
const line = (x1, y1, x2, y2, { sw = 4, dash } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${sw}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
const AH = '<marker id="ah" markerWidth="14" markerHeight="14" refX="11" refY="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L14 7L0 14z" fill="#0f100d"/></marker>';
const arrow = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="5" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""} marker-end="url(#ah)"/>`;
const S = (o = {}) => ({ size: 22, weight: 500, ...o });
const note = (y, s, w = 500) => text(600, y, s, { size: 24, anchor: "middle", weight: w });
// A box with a bold title and smaller lines under it, centered on x.
const node = (x, y, w, h, title, lines = [], fill = "#ffffff", mono = false) =>
  box(x - w / 2, y, w, h, { fill, r: 16 }) + text(x, y + 40, title, { size: 26, weight: 800, anchor: "middle" }) +
  lines.map((l, i) => text(x, y + 76 + i * 30, l, S({ anchor: "middle", mono }))).join("");
const circle = (cx, cy, r, { fill = "#ffffff", sw = 4 } = {}) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;

const M = (o = {}) => ({ size: 18, weight: 500, mono: true, ...o });
const lines = (x, y, arr, o = {}) => arr.map((l, i) => text(x, y + i * 26, l, i === 0 ? S({ size: 19, weight: 800 }) : M(o))).join("");

const PINK = "#f4b6c2";
const ZONA = [
  ["STAF", "10", "vlan10-staf", "192.168.10.1/24", ".100-.199", "8 jam", M3],
  ["TAMU", "20", "vlan20-tamu", "192.168.20.1/24", ".100-.250", "1 jam", PINK],
  ["PRINTER", "30", "vlan30-printer", "192.168.30.1/24", ".100-.120", "1 hari", M1],
];

function topologiVlan() {
  let b = text(600, 58, "Topologi RTR-KANTOR: satu bridge, tiga VLAN", { size: 34, weight: 800, anchor: "middle" });
  b += node(600, 86, 260, 60, "Internet") + line(600, 146, 600, 176);
  b += node(600, 176, 260, 60, "Modem ISP") + line(600, 236, 600, 290);
  b += text(616, 272, "ether1  WAN, DHCP dari ISP", M({ size: 19, weight: 700 }));
  b += box(160, 290, 880, 120, { fill: M1, r: 18 });
  b += text(600, 334, "RTR-KANTOR  (RouterOS v7)", { size: 28, weight: 800, anchor: "middle" });
  b += text(600, 370, "bridge br-lan  vlan-filtering=yes", M({ size: 21, anchor: "middle", weight: 700 }));
  b += text(600, 398, "gateway .1 di vlan10-staf, vlan20-tamu, vlan30-printer", S({ size: 19, anchor: "middle" }));
  const port = (x, nm, tag, title, sub, fill) => {
    let s = line(x, 410, x, 520, { sw: 5 }) + box(x - 62, 428, 124, 40, { fill: "#ffffff", r: 10, sw: 3 }) + text(x, 455, nm, M({ size: 19, weight: 800, anchor: "middle" }));
    s += text(x + 14, 500, tag, S({ size: 19, weight: 700 }));
    s += box(x - 150, 520, 300, 130, { fill, r: 16 }) + text(x, 558, title, { size: 25, weight: 800, anchor: "middle" });
    return s + sub.map((l, i) => text(x, 590 + i * 26, l, S({ size: 19, anchor: "middle" }))).join("");
  };
  b += port(250, "ether2", "trunk 10, 20, 30 bertag", "Access point", ["SSID Kantor-Staf -> VLAN 10", "SSID Kantor-Tamu -> VLAN 20"], "#ffffff");
  b += port(600, "ether3", "VLAN 10 tanpa tag", "PC staf", ["pvid=10", "dapat 192.168.10.1xx"], M3);
  b += port(950, "ether4", "VLAN 30 tanpa tag", "Printer", ["pvid=30", "tetap 192.168.30.10"], M1);
  // IP plan table
  const cols = [60, 220, 320, 560, 830, 1030];
  const head = ["Zona", "VLAN", "Interface", "Gateway", "Pool DHCP", "Sewa"];
  b += head.map((h, i) => text(cols[i], 712, h, S({ size: 20, weight: 800 }))).join("") + line(50, 726, 1150, 726, { sw: 3 });
  ZONA.forEach(([z, v, ifc, gw, pool, sewa, fill], r) => {
    const y = 744 + r * 52;
    b += box(50, y, 1100, 44, { fill, r: 10, sw: 2 });
    [z, v, ifc, gw, pool, sewa].forEach((c, i) => (b += text(cols[i], y + 30, c, i === 0 ? S({ size: 20, weight: 800 }) : M({ size: 19 }))));
  });
  b += note(930, "Alamat .2 sampai .99 disisakan untuk alamat tetap. Hindari 192.168.0.x dan 192.168.1.x milik modem.", 500);
  return frame("Topologi jaringan kantor: modem ISP di ether1, access point trunk VLAN 10, 20, 30 di ether2, PC staf VLAN 10 di ether3, printer VLAN 30 di ether4, dan tabel rencana IP tiap VLAN", 970, b);
}

function bridgeVlan() {
  let b = text(600, 58, "Perjalanan frame di bridge dengan vlan-filtering", { size: 34, weight: 800, anchor: "middle" });
  const step = (x, n, t, sub, fill = "#ffffff") => {
    let s = box(x, 100, 250, 150, { fill, r: 16 }) + circle(x + 30, 130, 18, { fill: M3, sw: 3 }) + text(x + 30, 138, n, { size: 22, weight: 800, anchor: "middle" });
    s += text(x + 58, 140, t, S({ size: 22, weight: 800 }));
    return s + sub.map((l, i) => text(x + 20, 182 + i * 26, l, S({ size: 19 }))).join("");
  };
  b += step(40, 1, "PC staf", ["kirim frame", "tanpa tag ke ether3"]);
  b += step(330, 2, "ether3", ["pvid=10: frame", "diberi tag VLAN 10"], M1);
  b += step(620, 3, "br-lan", ["cek tabel VLAN 10:", "port mana boleh?"], M1);
  b += step(910, 4, "Keluar", ["ether2 bertag 10,", "atau ke vlan10-staf"], M3);
  b += arrow(294, 175, 324, 175) + arrow(584, 175, 614, 175) + arrow(874, 175, 904, 175);
  // VLAN table
  b += text(60, 318, "Tabel /interface bridge vlan", S({ size: 24, weight: 800 }));
  const cx = [400, 560, 720, 880, 1040], ports = ["ether2", "ether3", "ether4", "br-lan"];
  b += text(60, 366, "VLAN", S({ size: 20, weight: 800 })) + ports.map((p, i) => text(cx[i], 366, p, M({ size: 20, weight: 800, anchor: "middle" }))).join("");
  b += text(cx[4], 366, "interface", S({ size: 20, weight: 800, anchor: "middle" }));
  const rows = [["10 STAF", ["T", "U", "-", "T"], "vlan10-staf"], ["20 TAMU", ["T", "-", "-", "T"], "vlan20-tamu"], ["30 PRINTER", ["T", "-", "U", "T"], "vlan30-printer"]];
  rows.forEach(([v, cells, ifc], r) => {
    const y = 386 + r * 64;
    b += text(60, y + 38, v, S({ size: 21, weight: 800 }));
    cells.forEach((c, i) => {
      const fill = c === "T" ? M3 : c === "U" ? M1 : "#ffffff";
      b += box(cx[i] - 60, y, 120, 52, { fill, r: 10, sw: c === "-" ? 2 : 3 }) + text(cx[i], y + 35, c === "T" ? "tagged" : c === "U" ? "untagged" : "-", M({ size: 18, weight: 700, anchor: "middle" }));
    });
    b += text(cx[4], y + 35, ifc, M({ size: 18, anchor: "middle" }));
  });
  b += box(40, 600, 1120, 190, { r: 16, sw: 3 });
  b += text(64, 640, "Yang sering terlewat", S({ size: 22, weight: 800 }));
  b += text(64, 676, "br-lan wajib tagged di setiap VLAN. Tanpa itu router tidak ikut di VLAN dan gateway .1 diam.", S({ size: 20 }));
  b += text(64, 708, "ether2 hanya menerima frame bertag, ether3 dan ether4 hanya frame tanpa tag (frame-types).", S({ size: 20 }));
  b += text(64, 740, "TAMU tidak punya port untagged di kabel: tamu datang lewat AP di ether2 dengan tag 20.", S({ size: 20 }));
  b += text(64, 772, "Nyalakan vlan-filtering=yes paling akhir, dengan Safe Mode.", S({ size: 20, weight: 700 }));
  return frame("Frame tanpa tag dari PC staf masuk ether3, diberi tag VLAN 10 oleh pvid, lalu keluar lewat ether2 bertag atau ke interface vlan10-staf, dengan tabel tagged dan untagged per port", 820, b, AH);
}

function matriksAkses() {
  let b = text(600, 58, "Matriks akses sebagai peta: siapa boleh bicara dengan siapa", { size: 32, weight: 800, anchor: "middle" });
  b += node(300, 100, 300, 90, "Internet", ["lewat NAT di ether1"]);
  b += node(900, 100, 300, 90, "Router (kelola)", ["Winbox, SSH"]);
  b += node(170, 440, 270, 120, "TAMU", ["VLAN 20", "kepercayaan rendah"], PINK);
  b += node(600, 440, 270, 120, "STAF", ["VLAN 10", "kepercayaan tinggi"], M3);
  b += node(1030, 440, 270, 120, "PRINTER", ["VLAN 30", "hanya menerima"], M1);
  // allowed
  b += arrow(170, 434, 270, 200) + text(110, 320, "boleh,", S({ size: 20, weight: 800 })) + text(110, 346, "dibatasi", S({ size: 20, weight: 800 }));
  b += arrow(560, 434, 340, 200) + text(470, 310, "boleh", S({ size: 20, weight: 800 }));
  b += arrow(640, 434, 860, 200) + text(770, 310, "boleh", S({ size: 20, weight: 800 }));
  b += arrow(737, 500, 887, 500) + text(812, 486, "cetak", S({ size: 19, weight: 800, anchor: "middle" }));
  // denied
  const x = (cx, cy) => line(cx - 14, cy - 14, cx + 14, cy + 14, { sw: 6 }) + line(cx - 14, cy + 14, cx + 14, cy - 14, { sw: 6 });
  b += line(307, 500, 463, 500, { sw: 4, dash: "10 10" }) + x(385, 500) + text(385, 540, "tidak", S({ size: 19, weight: 800, anchor: "middle" }));
  b += line(1030, 434, 1030, 300, { sw: 4, dash: "10 10" }) + x(1030, 300) + text(1030, 266, "koneksi keluar", S({ size: 19, weight: 800, anchor: "middle" })) + text(1030, 240, "tidak memulai", S({ size: 19, weight: 800, anchor: "middle" }));
  b += box(40, 620, 1120, 150, { r: 16, sw: 3 });
  b += text(64, 660, "Garis putus dengan silang = ditolak. Yang tidak digambar juga ditolak: drop di akhir rantai.", S({ size: 20, weight: 700 }));
  b += text(64, 694, "Laptop tamu terkena malware hanya menjangkau internet: tidak ke STAF, PRINTER, atau router.", S({ size: 20 }));
  b += text(64, 728, "Semua zona tetap boleh memakai DNS, DHCP, dan NTP dari router.", S({ size: 20 }));
  return frame("Peta akses antar zona: STAF boleh ke internet, router, dan printer; TAMU hanya ke internet dengan batas bandwidth; PRINTER tidak punya jalur keluar", 800, b, AH);
}

const DIAGRAMS = { "topologi-vlan": topologiVlan, "bridge-vlan": bridgeVlan, "matriks-akses": matriksAkses };
mkdirSync("public/studio/jaringan-kantor-kecil", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/jaringan-kantor-kecil/${name}.svg`, draw());
  console.log(name);
}
