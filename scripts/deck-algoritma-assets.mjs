// Renders the assets scripts/deck-algoritma.py needs into <dir>: lucide icons
// (icons/<name>-w.png white, -k.png green, 256px), the Python logo from Simple Icons (CC0,
// from a temporary install: cd /tmp && npm i simple-icons) and the deck diagrams (<name>.png, 2x).
// Run: node scripts/deck-algoritma-assets.mjs <dir> <path to node_modules/simple-icons>
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const T = JSON.parse(readFileSync(new URL("deck-themes.json", import.meta.url), "utf8"))["algoritma"];

const [dir, simpleIcons] = process.argv.slice(2);
if (!dir || !simpleIcons) throw new Error("usage: node scripts/deck-algoritma-assets.mjs <dir> <path to node_modules/simple-icons>");
mkdirSync(join(dir, "icons"), { recursive: true });

const ICONS = "workflow gauge clock list-checks layers share-2 eye braces type search file-text package puzzle link split list shuffle repeat undo redo scale target zap network git-branch trees tree-pine arrow-up-down arrow-left-right users globe shield-check lightbulb rocket clipboard-check book-open check refresh-cw database box boxes brain cpu code terminal settings route key-round sparkles ruler hash binary".split(" ");
const attr = (o) => Object.entries(o).filter(([k]) => k !== "key").map(([k, v]) => `${k}="${v}"`).join(" ");
for (const name of ICONS) {
  let mod;
  try {
    mod = await import(`../node_modules/lucide-react/dist/esm/icons/${name}.mjs`);
  } catch {
    console.log("tidak ada ikon", name);
    continue;
  }
  if (!mod.__iconData) {
    console.log("alias, dilewati:", name);
    continue;
  }
  const body = mod.__iconData.node.map(([tag, a]) => `<${tag} ${attr(a)}/>`).join("");
  for (const [suffix, color] of [["w", "#ffffff"], ["k", "#" + T.accent]]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="256" height="256" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
    await sharp(Buffer.from(svg), { density: 300 }).resize(256, 256).png().toFile(join(dir, "icons", `${name}-${suffix}.png`));
  }
}
const logo = readFileSync(join(simpleIcons, "icons", "python.svg"), "utf8").replace("<path ", '<path fill="#ffffff" ');
await sharp(Buffer.from(logo.replace("<svg ", '<svg width="512" height="512" ')), { density: 300 }).resize(512, 512).png().toFile(join(dir, "icons", "logo-python-w.png"));

const INK = "#" + T.ink, G = "#" + T.accent, GL = "#" + T.accentLight, AM = "#f59e0b", AML = "#fef3c7", SL = "#f1f5f9", RED = "#ef4444", REDL = "#fee2e2", GR = "#64748b";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const t = (x, y, s, { size = 30, w = 600, a = "middle", fill = INK, mono = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${w}" text-anchor="${a}" fill="${fill}"${mono ? ' font-family="DejaVu Sans Mono, monospace"' : ""}>${esc(s)}</text>`;
const box = (x, y, w, h, fill = "#fff", stroke = INK) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;
const arrow = (x1, y1, x2, y2, stroke = INK) => {
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
  const hx = x2 - ux * 22, hy = y2 - uy * 22;
  return `<line x1="${x1}" y1="${y1}" x2="${hx}" y2="${hy}" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/><polygon points="${x2},${y2} ${hx - uy * 12},${hy + ux * 12} ${hx + uy * 12},${hy - ux * 12}" fill="${stroke}"/>`;
};
const line = (x1, y1, x2, y2, stroke = INK, w = 5) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>`;
const circle = (x, y, r, fill = "#fff", stroke = INK) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;
const sheet = (h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 ${h}" width="1200" height="${h}" font-family="DejaVu Sans, sans-serif"><rect width="1200" height="${h}" fill="#fff"/>${body}</svg>`;

// Big O curves: x = n (0..1), y = steps scaled to the plot area.
const curve = (f, stroke) => {
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const x = i / 60, y = Math.min(f(x), 1);
    pts.push(`${(130 + x * 780).toFixed(1)},${(690 - y * 520).toFixed(1)}`);
  }
  return `<polyline points="${pts.join(" ")}" fill="none" stroke="${stroke}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
};
const cell = (x, y, w, s, fill = "#fff", stroke = INK, size = 34) => box(x, y, w, 90, fill, stroke) + t(x + w / 2, y + 60, s, { size, w: 700, mono: true });

const D = {
  "algo-bigo": sheet(800, [
    t(600, 60, "Pertumbuhan jumlah langkah", { size: 40, w: 700 }),
    line(130, 690, 920, 690, INK, 4), line(130, 690, 130, 150, INK, 4),
    t(585, 745, "ukuran data (n)", { size: 26, w: 500, fill: GR }), t(60, 420, "langkah", { size: 26, w: 500, fill: GR }),
    curve(() => 0.04, G), curve((x) => Math.log2(1 + x * 30) / 14, "#0ea5e9"), curve((x) => x * 0.55, AM), curve((x) => (x * Math.log2(1 + x * 30)) / 4.8, "#8b5cf6"), curve((x) => x * x * 1.6, RED),
    ...[["O(1)", G, 230], ["O(log n)", "#0ea5e9", 215], ["O(n)", AM, 375], ["O(n log n)", "#8b5cf6", 300], ["O(n^2)", RED, 135]].map(([n, c, y], i) => `<rect x="${940}" y="${180 + i * 52}" width="26" height="26" rx="6" fill="${c}"/>` + t(978, 202 + i * 52, n, { size: 22, a: "start", w: 600 })),
  ].join("")),
  "algo-hash": sheet(760, [
    t(600, 60, "Hash map: kunci menjadi indeks", { size: 40, w: 700 }),
    ...["\"apel\"", "\"jeruk\"", "\"mangga\""].map((k, i) => box(50, 130 + i * 160, 250, 100, SL) + t(175, 195 + i * 160, k, { size: 34, w: 700, mono: true })),
    box(400, 270, 230, 100, GL, G), t(515, 335, "hash( )", { size: 38, w: 700, mono: true }),
    ...[0, 1, 2].map((i) => arrow(302, 180 + i * 160, 398, 300 + i * 20, GR)),
    arrow(632, 320, 738, 320, G),
    ...[0, 1, 2, 3, 4].map((i) => box(740, 120 + i * 100, 400, 86, i === 1 ? AML : i === 3 ? GL : "#fff", i === 1 ? AM : i === 3 ? G : INK) + t(775, 175 + i * 100, String(i), { size: 28, w: 700, fill: GR }) + t(955, 175 + i * 100, i === 1 ? "apel: 5" : i === 3 ? "jeruk: 2" : "", { size: 30, w: 600, mono: true })),
    t(600, 705, "Hitung hash, lompat ke indeks, bandingkan kunci: O(1) rata-rata", { size: 26, w: 500 }),
  ].join("")),
  "algo-linked": sheet(640, [
    t(600, 60, "Linked list: rantai node", { size: 40, w: 700 }),
    t(120, 180, "kepala", { size: 28, w: 700, fill: G }), arrow(120, 195, 120, 255, G),
    ...[0, 1, 2].map((i) => { const x = 40 + i * 390; return box(x, 270, 300, 130, i === 0 ? GL : "#fff", i === 0 ? G : INK) + line(x + 190, 270, x + 190, 400, INK, 3) + t(x + 95, 350, String([10, 20, 30][i]), { size: 44, w: 700, mono: true }) + (i < 2 ? arrow(x + 245, 335, x + 385, 335) : arrow(x + 245, 335, x + 330, 335, GR) + t(x + 360, 345, "None", { size: 28, w: 700, mono: true, a: "start", fill: GR })); }),
    t(135, 440, "nilai", { size: 24, w: 500, fill: GR }), t(235, 440, "berikut", { size: 24, w: 500, fill: GR }),
    box(60, 500, 1080, 100, AML, AM), t(600, 563, "Akses ke-k: O(n)   |   sisip di depan: O(1)   |   hanya ubah penunjuk", { size: 28, w: 600 }),
  ].join("")),
  "algo-stackqueue": sheet(820, [
    t(300, 60, "Stack (LIFO)", { size: 36, w: 700 }), t(880, 60, "Queue (FIFO)", { size: 36, w: 700 }),
    ...["c", "b", "a"].map((s, i) => cell(150, 200 + i * 110, 300, s, i === 0 ? GL : "#fff", i === 0 ? G : INK)),
    arrow(300, 110, 300, 190, G), t(380, 150, "push / pop", { size: 24, w: 600, fill: G, a: "start" }),
    line(130, 200, 130, 520, INK, 5), line(470, 200, 470, 520, INK, 5), line(130, 520, 470, 520, INK, 5),
    ...["a", "b", "c", "d"].map((s, i) => cell(570 + i * 150, 270, 130, s, i === 0 ? GL : i === 3 ? AML : "#fff", i === 0 ? G : i === 3 ? AM : INK)),
    t(635, 250, "depan", { size: 24, w: 600, fill: G }), t(1085, 250, "belakang", { size: 24, w: 600, fill: AM }),
    arrow(635, 460, 635, 385, G), t(635, 495, "popleft", { size: 24, w: 600, fill: G }), arrow(1085, 440, 1085, 385, AM), t(1085, 475, "append", { size: 24, w: 600, fill: AM }),
    box(60, 600, 1080, 150, SL), t(600, 660, "Stack: undo, kurung seimbang, call stack", { size: 28, w: 600 }), t(600, 715, "Queue: antrean tugas, BFS", { size: 28, w: 600 }),
  ].join("")),
  "algo-callstack": sheet(780, [
    t(600, 60, "Call stack faktorial(3)", { size: 40, w: 700 }),
    ...[["faktorial(3)", "menunggu 3 * faktorial(2)", AML, AM], ["faktorial(2)", "menunggu 2 * faktorial(1)", "#fff", INK], ["faktorial(1)", "kasus dasar: kembali 1", GL, G]].map(([a, b, f, s], i) => box(120, 520 - i * 150, 600, 120, f, s) + t(420, 570 - i * 150, a, { size: 34, w: 700, mono: true }) + t(420, 612 - i * 150, b, { size: 24, w: 500 })),
    arrow(780, 560, 780, 130, G), t(900, 330, "frame menumpuk", { size: 26, w: 600, fill: G }),
    arrow(1100, 130, 1100, 560, AM), t(1050, 640, "hasil kembali", { size: 24, w: 600, fill: AM }),
    t(600, 735, "Memori sebanding kedalaman rekursi", { size: 26, w: 500 }),
  ].join("")),
  "algo-binary": sheet(760, [
    t(600, 60, "Pencarian biner: cari 23", { size: 40, w: 700 }),
    ...[2, 5, 8, 12, 16, 23, 38].map((v, i) => cell(40 + i * 160, 140, 140, String(v), v === 12 ? AML : "#fff", v === 12 ? AM : INK)),
    t(110, 120, "kiri", { size: 24, w: 600, fill: G }), t(1030, 120, "kanan", { size: 24, w: 600, fill: G }), t(590, 120, "tengah", { size: 24, w: 600, fill: AM }),
    t(600, 300, "12 < 23, buang separuh kiri", { size: 28, w: 600 }),
    ...[2, 5, 8, 12, 16, 23, 38].map((v, i) => i < 4 ? cell(40 + i * 160, 340, 140, String(v), SL, "#cbd5e1", 34) : cell(40 + i * 160, 340, 140, String(v), v === 23 ? AML : "#fff", v === 23 ? AM : INK)),
    t(840, 320, "tengah", { size: 24, w: 600, fill: AM }),
    t(600, 500, "23 ditemukan", { size: 32, w: 700, fill: G }),
    box(60, 560, 1080, 150, GL, G), t(600, 625, "Tiap langkah membuang separuh data", { size: 30, w: 700 }), t(600, 675, "1 miliar elemen: sekitar 30 langkah", { size: 28, w: 500 }),
  ].join("")),
  "algo-merge": sheet(820, [
    t(600, 60, "Merge sort: bagi lalu gabung", { size: 40, w: 700 }),
    cell(380, 110, 440, "5 2 9 1 7 3", AML, AM, 32),
    cell(160, 250, 340, "5 2 9", "#fff", INK, 32), cell(700, 250, 340, "1 7 3", "#fff", INK, 32),
    arrow(500, 200, 330, 245), arrow(700, 200, 870, 245),
    ...["5", "2 9", "1", "7 3"].map((s, i) => cell(40 + i * 290, 400, 250, s, "#fff", INK, 32)),
    t(600, 395, "dibagi sampai satu elemen", { size: 24, w: 500, fill: GR }),
    cell(160, 560, 340, "2 5 9", GL, G, 32), cell(700, 560, 340, "1 3 7", GL, G, 32),
    cell(380, 700, 440, "1 2 3 5 7 9", GL, G, 32),
    arrow(330, 652, 520, 695, G), arrow(870, 652, 680, 695, G),
    t(1110, 610, "gabung", { size: 26, w: 700, fill: G }),
  ].join("")),
  "algo-tree": sheet(780, [
    t(600, 60, "Binary search tree", { size: 40, w: 700 }),
    ...[[600, 150, 8], [330, 320, 3], [870, 320, 10], [180, 500, 1], [480, 500, 6], [1020, 500, 14]].map(([x, y, v]) => circle(x, y, 52, v === 8 ? AML : "#fff", v === 8 ? AM : INK) + t(x, y + 13, String(v), { size: 38, w: 700, mono: true })),
    line(570, 195, 360, 280), line(630, 195, 840, 280), line(300, 365, 210, 460), line(360, 365, 450, 460), line(900, 365, 990, 460),
    t(600, 85, "", {}), t(600, 130, "", {}),
    box(60, 590, 1080, 150, SL),
    t(600, 640, "inorder: 1 3 6 8 10 14 (terurut)", { size: 30, w: 700, mono: true, fill: G }),
    t(600, 685, "preorder: 8 3 1 6 10 14", { size: 26, w: 500, mono: true }), t(600, 722, "kiri lebih kecil, kanan lebih besar", { size: 24, w: 500, fill: GR }),
  ].join("")),
  "algo-graph": sheet(780, [
    t(600, 60, "BFS: melebar menurut jarak dari A", { size: 40, w: 700 }),
    ...[["A", 200, 360, G, GL], ["B", 520, 200, AM, AML], ["C", 520, 520, AM, AML], ["D", 840, 360, "#0ea5e9", "#e0f2fe"], ["E", 1080, 360, "#8b5cf6", "#ede9fe"]].map(([n, x, y, s, f]) => circle(x, y, 56, f, s) + t(x, y + 13, n, { size: 40, w: 700 })),
    line(250, 335, 470, 225), line(250, 385, 470, 495), line(570, 220, 790, 335), line(570, 500, 790, 385), line(896, 360, 1024, 360),
    t(200, 450, "jarak 0", { size: 24, w: 600, fill: G }), t(600, 140, "jarak 1", { size: 24, w: 600, fill: AM }), t(840, 460, "jarak 2", { size: 24, w: 600, fill: "#0ea5e9" }), t(1080, 460, "jarak 3", { size: 24, w: 600, fill: "#8b5cf6" }),
    box(60, 620, 1080, 120, GL, G), t(600, 672, "Queue + himpunan visited: O(V + E)", { size: 30, w: 700 }), t(600, 715, "Jarak terpendek pada graf tanpa bobot", { size: 26, w: 500 }),
  ].join("")),
};
for (const [name, svg] of Object.entries(D)) {
  const png = await sharp(Buffer.from(svg), { density: 192 }).png().toBuffer();
  await sharp(png).toFile(join(dir, `${name}.png`));
}
console.log("aset selesai:", Object.keys(D).length, "diagram");
