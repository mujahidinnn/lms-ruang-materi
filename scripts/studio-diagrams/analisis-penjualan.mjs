// Diagrams for Studio Proyek "analisis-penjualan", embedded as ![ket](/studio/analisis-penjualan/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/analisis-penjualan.mjs
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
// The charts (grafik-*.webp) are not drawn here: they are the real output of the
// project's buat-grafik.py run on its penjualan.csv, converted to webp.

// Cleaning as a pipeline: row count per stage and why order matters.
function pipaBersihkan() {
  let b = text(600, 58, "Urutan membersihkan data: 37 baris → 34 baris", { size: 38, weight: 800, anchor: "middle" });
  const steps = [
    ["1", "drop_duplicates()", "TRX022 kembar dibuang", 36, M1],
    ["2", "str.strip() + replace", "7 nama produk yang sama", 36, M1],
    ["3", 'str.replace(r"\\D", "")', '"Rp15.000" → 15000', 36, M1],
    ["4", "fillna(median per produk)", "harga TRX029 diisi", 36, M3],
    ["5", "to_datetime(errors=\"coerce\")", "2026-02-30 → NaT", 36, M1],
    ["6", "dropna(tanggal, jumlah)", "tanggal mustahil + TRX010", 34, PINK],
  ];
  const y0 = 100, h = 76, gap = 12;
  b += box(60, y0, 170, h, { r: 16 }) + text(145, y0 + 34, "CSV mentah", { size: 20, weight: 800, anchor: "middle" }) + text(145, y0 + 62, "37 baris", S({ size: 19, anchor: "middle", weight: 700 }));
  steps.forEach(([n, code, what, rows, f], i) => {
    const y = y0 + (i + 1) * (h + gap);
    b += arrow(145, y - gap - 2 + (i === 0 ? 0 : 0), 145, y - 2);
    b += `<circle cx="145" cy="${y + h / 2}" r="26" fill="${f}" stroke="${INK}" stroke-width="4"/>` + text(145, y + h / 2 + 9, n, { size: 24, weight: 800, anchor: "middle" });
    b += box(200, y, 760, h, { fill: f, r: 16 }) + mono(224, y + 32, code, { size: 19, weight: 700 }) + text(224, y + 62, what, S({ size: 19 }));
    b += text(1110, y + h / 2 + 10, `${rows} baris`, { size: 24, weight: 800, anchor: "end" });
  });
  // order note between 2 and 4
  const y2 = y0 + 2 * (h + gap), y4 = y0 + 4 * (h + gap);
  b += `<path d="M962 ${y2 + h / 2} C 1010 ${y2 + h / 2}, 1010 ${y4 + h / 2}, 966 ${y4 + h / 2}" fill="none" stroke="${INK}" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" marker-end="url(#ah)"/>`;
  const yN = y0 + 7 * (h + gap) + 20;
  b += box(60, yN, 1080, 100, { r: 18, dash: "10 8", sw: 3 });
  b += text(84, yN + 40, "Langkah 2 harus sebelum 4: median dihitung per nama produk.", { size: 21, weight: 800 });
  b += text(84, yN + 74, 'Kalau "kopi susu gula aren" belum dirapikan, ia dianggap produk lain dengan harga sendiri.', S({ size: 20 }));
  b += note(yN + 150, "Hanya langkah 1 dan 6 yang membuang baris: 3 dari 37, sekitar 8 persen data.");
  return frame("Pipa pembersihan data penjualan: buang kembar, rapikan nama, harga jadi angka, isi harga kosong, tanggal mustahil jadi NaT, buang baris tanpa tanggal atau jumlah; 37 menjadi 34 baris", yN + 180, b, AH);
}

const DIAGRAMS = { "pipa-bersihkan": pipaBersihkan };
mkdirSync("public/studio/analisis-penjualan", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/analisis-penjualan/${name}.svg`, draw());
  console.log(name);
}
