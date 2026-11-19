// Renders the assets scripts/deck-typescript.py needs into <dir>: lucide icons
// (icons/<name>-w.png white, -k.png green, 256px) and the deck diagrams
// (<name>.png, 2x), plus logo-typescript-w.png from Simple Icons (CC0), taken from
// a temporary install outside the repo (cd /tmp && npm i simple-icons).
// Run: node scripts/deck-typescript-assets.mjs <dir> <path to node_modules/simple-icons>
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { readFileSync } from "node:fs";

const T = JSON.parse(readFileSync(new URL("deck-themes.json", import.meta.url), "utf8"))["typescript"];

const [dir, simpleIcons] = process.argv.slice(2);
if (!dir || !simpleIcons) throw new Error("usage: node scripts/deck-typescript-assets.mjs <dir> <path to node_modules/simple-icons>");
mkdirSync(join(dir, "icons"), { recursive: true });

const ICONS = "file-code wrench braces type list-checks shield-check package layers boxes git-branch route split cpu terminal settings globe lock lightbulb rocket clipboard-check book-open search zap check refresh-cw funnel key-round database server activity code bug file-text link eye ban circle shuffle gauge puzzle target scale box tag sparkles".split(" ");
const attr = (o) => Object.entries(o).filter(([k]) => k !== "key").map(([k, v]) => `${k}="${v}"`).join(" ");
for (const name of ICONS) {
  const { __iconData } = await import(`../node_modules/lucide-react/dist/esm/icons/${name}.mjs`);
  const body = __iconData.node.map(([tag, a]) => `<${tag} ${attr(a)}/>`).join("");
  for (const [suffix, color] of [["w", "#ffffff"], ["k", "#" + T.accent]]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="256" height="256" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
    await sharp(Buffer.from(svg), { density: 300 }).resize(256, 256).png().toFile(join(dir, "icons", `${name}-${suffix}.png`));
  }
}

const logo = (await import("node:fs")).readFileSync(join(simpleIcons, "icons", "typescript.svg"), "utf8").replace("<path ", '<path fill="#ffffff" ');
await sharp(Buffer.from(logo.replace("<svg ", '<svg width="512" height="512" ')), { density: 300 }).resize(512, 512).png().toFile(join(dir, "icons", "logo-typescript-w.png"));

const INK = "#" + T.ink, G = "#" + T.accent, GL = "#" + T.accentLight, AM = "#f59e0b", AML = "#fef3c7", SL = "#f1f5f9", RED = "#ef4444", REDL = "#fee2e2";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const t = (x, y, s, { size = 30, w = 600, a = "middle", fill = INK, mono = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${w}" text-anchor="${a}" fill="${fill}"${mono ? ' font-family="DejaVu Sans Mono, monospace"' : ""}>${esc(s)}</text>`;
const box = (x, y, w, h, fill = "#fff", stroke = INK) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;
const arrow = (x1, y1, x2, y2, stroke = INK) => {
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
  const hx = x2 - ux * 22, hy = y2 - uy * 22;
  return `<line x1="${x1}" y1="${y1}" x2="${hx}" y2="${hy}" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/><polygon points="${x2},${y2} ${hx - uy * 12},${hy + ux * 12} ${hx + uy * 12},${hy - ux * 12}" fill="${stroke}"/>`;
};
const sheet = (h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 ${h}" width="1200" height="${h}" font-family="DejaVu Sans, sans-serif"><rect width="1200" height="${h}" fill="#fff"/>${body}</svg>`;

const D = {
  "ts-ke-js": sheet(900, [
    t(600, 70, "Dari TypeScript ke JavaScript", { size: 40, w: 700 }),
    box(60, 150, 400, 330, SL), t(260, 205, "app.ts", { size: 32, w: 700 }),
    t(90, 280, "function sapa(", { a: "start", size: 28, mono: true, w: 500 }), t(90, 330, "  nama: string", { a: "start", size: 28, mono: true, w: 700, fill: RED }),
    t(90, 380, "): string {", { a: "start", size: 28, mono: true, w: 700, fill: RED }), t(90, 430, "  return nama; }", { a: "start", size: 28, mono: true, w: 500 }),
    arrow(470, 315, 730, 315, INK), box(500, 255, 200, 70, GL, G), t(600, 302, "tsc", { size: 34, w: 700 }),
    box(740, 150, 400, 330, GL, G), t(940, 205, "app.js", { size: 32, w: 700 }),
    t(770, 280, "function sapa(", { a: "start", size: 28, mono: true, w: 500 }), t(770, 330, "  nama", { a: "start", size: 28, mono: true, w: 500 }),
    t(770, 380, ") {", { a: "start", size: 28, mono: true, w: 500 }), t(770, 430, "  return nama; }", { a: "start", size: 28, mono: true, w: 500 }),
    t(260, 530, "Ada tipe, dicek di editor", { size: 26, w: 500 }), t(940, 530, "Tipe sudah dihapus", { size: 26, w: 500 }),
    box(60, 620, 1080, 190, AML, AM),
    t(600, 690, "Compile time: tipe diperiksa", { size: 32, w: 700 }), t(600, 740, "Runtime: hanya JavaScript yang berjalan", { size: 32, w: 700 }),
    t(600, 790, "Data dari luar tetap perlu divalidasi dengan kode", { size: 24, w: 500 }),
  ].join("")),
  narrowing: sheet(900, [
    t(600, 70, "Narrowing dengan typeof", { size: 40, w: 700 }),
    box(380, 130, 440, 100, AML, AM), t(600, 195, "nilai: string | number", { size: 32, w: 700, mono: true }),
    box(330, 300, 540, 90, SL), t(600, 358, "typeof nilai === \"string\" ?", { size: 30, w: 600, mono: true }),
    arrow(600, 232, 600, 296), arrow(450, 392, 270, 520, G), arrow(750, 392, 930, 520, INK),
    t(300, 460, "ya", { size: 28, w: 700, fill: G }), t(900, 460, "tidak", { size: 28, w: 700 }),
    box(70, 530, 400, 150, GL, G), t(270, 595, "nilai: string", { size: 32, w: 700, mono: true }), t(270, 645, "toUpperCase() aman", { size: 26, w: 500 }),
    box(730, 530, 400, 150, SL), t(930, 595, "nilai: number", { size: 32, w: 700, mono: true }), t(930, 645, "toFixed(2) aman", { size: 26, w: 500 }),
    t(600, 770, "Compiler mengikuti alur kode dan menyempitkan tipe di tiap cabang", { size: 26, w: 500 }),
  ].join("")),
  generics: sheet(900, [
    t(600, 70, "Generics: tipe masukan menentukan tipe keluaran", { size: 38, w: 700 }),
    box(380, 300, 440, 150, GL, G), t(600, 365, "pertama<T>", { size: 40, w: 700, mono: true }), t(600, 415, "(a: T[]): T | undefined", { size: 24, w: 500, mono: true }),
    box(50, 150, 260, 90, SL), t(180, 208, "number[]", { size: 32, w: 700, mono: true }),
    box(50, 340, 260, 90, SL), t(180, 398, "string[]", { size: 32, w: 700, mono: true }),
    box(50, 530, 260, 90, SL), t(180, 588, "Siswa[]", { size: 32, w: 700, mono: true }),
    arrow(312, 195, 378, 340), arrow(312, 385, 378, 385), arrow(312, 575, 378, 430),
    box(890, 150, 260, 90, AML, AM), t(1020, 208, "number", { size: 32, w: 700, mono: true }),
    box(890, 340, 260, 90, AML, AM), t(1020, 398, "string", { size: 32, w: 700, mono: true }),
    box(890, 530, 260, 90, AML, AM), t(1020, 588, "Siswa", { size: 32, w: 700, mono: true }),
    arrow(822, 340, 888, 195), arrow(822, 385, 888, 385), arrow(822, 430, 888, 575),
    t(600, 740, "Satu fungsi, banyak tipe, tanpa kehilangan informasi seperti pada any", { size: 26, w: 500 }),
  ].join("")),
  "utility-types": sheet(900, [
    t(600, 70, "Turunkan tipe dari satu sumber", { size: 40, w: 700 }),
    box(360, 120, 480, 190, SL), t(600, 170, "Siswa", { size: 34, w: 700 }),
    t(600, 222, "id, nama, email, kelas?", { size: 28, w: 500, mono: true }),
    ...[["Partial<Siswa>", "semua opsional", 40], ["Pick<Siswa, \"id\" | \"nama\">", "hanya id dan nama", 330], ["Omit<Siswa, \"id\">", "tanpa id", 620], ["Readonly<Siswa>", "tak bisa diubah ulang", 905]].map(([n, d, x], i) =>
      arrow(600, 312, x + 130 - (i === 1 ? 0 : 0), 440, i % 2 ? G : INK) + box(x - 20, 445, 290 + (i === 1 ? 0 : 0), 190, i % 2 ? GL : AML, i % 2 ? G : AM) + t(x + 125, 515, n.length > 20 ? n.slice(0, 15) + "..." : n, { size: n.length > 20 ? 24 : 26, w: 700, mono: true }) + t(x + 125, 580, d, { size: 24, w: 500 })),
    t(600, 740, "Tipe turunan ikut berubah saat Siswa berubah", { size: 28, w: 500 }),
  ].join("")),
  strict: sheet(900, [
    t(600, 70, "strict: satu saklar, banyak pengaman", { size: 40, w: 700 }),
    box(100, 130, 1000, 470, GL, G), t(600, 185, "\"strict\": true", { size: 36, w: 700, mono: true }),
    ...["strictNullChecks", "noImplicitAny", "strictFunctionTypes", "strictPropertyInitialization", "useUnknownInCatchVariables"].map((n, i) =>
      box(150 + (i % 2) * 500, 220 + Math.floor(i / 2) * 120, 450, 90, "#fff", G) + t(375 + (i % 2) * 500, 278 + Math.floor(i / 2) * 120, n, { size: 26, w: 600, mono: true })),
    box(150 + 500, 460, 450, 90, SL) + t(875, 515, "dan lainnya", { size: 28, w: 500 }),
    box(100, 650, 1000, 120, AML, AM), t(600, 705, "noUncheckedIndexedAccess", { size: 34, w: 700, mono: true }), t(600, 750, "di luar strict, dinyalakan terpisah", { size: 26, w: 500 }),
  ].join("")),
  validasi: sheet(900, [
    t(600, 70, "Data dari luar: jangan hanya percaya as", { size: 38, w: 700 }),
    box(40, 260, 240, 150, SL), t(160, 330, "fetch", { size: 36, w: 700, mono: true }), t(160, 375, "respons API", { size: 24, w: 500 }),
    arrow(282, 335, 340, 335),
    box(345, 260, 240, 150, REDL, RED), t(465, 322, "json()", { size: 34, w: 700, mono: true }), t(465, 370, "tipe any", { size: 28, w: 500 }),
    arrow(587, 335, 645, 335),
    box(650, 260, 240, 150, AML, AM), t(770, 322, "unknown", { size: 34, w: 700, mono: true }), t(770, 370, "belum dipercaya", { size: 24, w: 500 }),
    arrow(892, 335, 950, 335),
    box(955, 260, 210, 150, GL, G), t(1060, 322, "Siswa", { size: 34, w: 700, mono: true }), t(1060, 370, "sudah aman", { size: 24, w: 500 }),
    box(560, 460, 420, 100, SL), t(770, 508, "type guard x is Siswa", { size: 28, w: 700, mono: true }), t(770, 543, "memeriksa isi saat runtime", { size: 22, w: 500 }),
    arrow(770, 458, 770, 414, G),
    t(600, 680, "Tipe tidak ada di runtime, jadi validasi harus berupa kode", { size: 28, w: 500 }),
  ].join("")),
};
for (const [name, svg] of Object.entries(D)) {
  writeFileSync(join(dir, `${name}.svg`), svg);
  await sharp(Buffer.from(svg), { density: 144 }).png().toFile(join(dir, `${name}.png`));
}
console.log("assets ->", dir, ICONS.length, "icons,", Object.keys(D).length, "diagrams");
