// Diagrams for Studio Proyek "scraper-harga-buku", embedded as ![ket](/studio/scraper-harga-buku/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/scraper-harga-buku.mjs
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

// Module split: pure rules, file I/O, and the loop that receives its I/O as parameters.
const path = (pts, o = {}) => `<path d="M${pts.map((p) => p.join(" ")).join(" L")}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}${o.head === false ? "" : ' marker-end="url(#ah)"'}/>`;
const lbl = (x, y, s, o = {}) => text(x, y, s, { size: 18, weight: 700, ...o });
const node = (x, y, w, t1, t2, o = {}) => box(x, y, w, 90, { r: 16, ...o }) + text(x + w / 2, y + (t2 ? 38 : 54), t1, { size: 21, weight: 800, anchor: "middle", mono: o.mono }) + (t2 ? text(x + w / 2, y + 68, t2, S({ size: 17, anchor: "middle" })) : "");

// Crawl loop: catalogue pages -> detail pages -> upsert + price history.
function alur() {
  let b = text(600, 50, "Alur crawl: katalog, detail, simpan", { size: 36, weight: 800, anchor: "middle" });
  b += node(40, 130, 260, "ambil(katalog)", "page-1 ... page-50.html", { fill: M1, mono: true });
  b += node(360, 130, 260, "parse_daftar()", "20 URL detail + next", { mono: true });
  b += node(680, 130, 220, "next ada?");
  b += node(960, 130, 200, "selesai", "log: selesai", { fill: M3 });
  b += arrow(302, 175, 352, 175) + arrow(622, 175, 672, 175) + arrow(902, 175, 952, 175) + lbl(930, 162, "tidak", { anchor: "middle" });
  b += path([[790, 128], [790, 96], [170, 96], [170, 122]]) + lbl(480, 88, "ya: halaman berikutnya", { anchor: "middle" });
  b += path([[490, 222], [490, 270], [170, 270], [170, 322]]) + lbl(500, 256, "untuk setiap URL detail (20x)", { weight: 600 });
  b += node(40, 330, 260, "ambil(detail)", "a-light-in-the-attic...", { fill: M1, mono: true });
  b += node(340, 330, 240, "parse_buku()", "upc, judul, harga, ...", { mono: true });
  b += node(620, 330, 250, "simpan_buku()", "upsert per UPC", { mono: true });
  b += node(910, 330, 250, "baru / harga beda?");
  b += arrow(302, 375, 332, 375) + arrow(582, 375, 612, 375) + arrow(872, 375, 902, 375);
  b += node(960, 500, 200, "+1 baris", "riwayat_harga", { fill: M3 });
  b += node(620, 500, 250, "tidak dicatat", "harga sama");
  b += arrow(1060, 422, 1060, 492) + lbl(1072, 466, "ya");
  b += path([[935, 422], [935, 545], [878, 545]]) + lbl(947, 466, "tidak");
  b += box(40, 500, 540, 90, { r: 16, dash: "10 8", sw: 3, fill: M1 });
  b += text(64, 538, "Semua ambil() lewat Pengambil:", { size: 20, weight: 800 });
  b += text(64, 570, "robots.txt, jeda, User-Agent, timeout, retry, cache", S({ size: 19 }));
  b += note(648, "Satu detail gagal: dicatat sebagai buku_gagal, crawl lanjut ke buku berikutnya.");
  b += note(684, "Setiap buku disimpan dalam transaksinya sendiri, jadi crawl yang terputus tidak merusak data.");
  return frame("Alur crawl: halaman katalog memberi 20 URL detail dan URL next; setiap detail di-parse lalu di-upsert berdasarkan UPC, dan riwayat_harga hanya bertambah untuk buku baru atau harga yang berubah", 720, b, AH);
}

// What happens inside Pengambil.ambil(url).
function pengambil() {
  let b = text(600, 50, "Di dalam Pengambil.ambil(url)", { size: 36, weight: 800, anchor: "middle" });
  const c1 = 40, c2 = 420, c3 = 840;
  b += node(c1, 100, 300, "ambil(url)", "", { mono: true });
  b += node(c2, 100, 340, "ada di cache?", "hanya dengan --cache");
  b += node(c3, 100, 320, "baca berkas cache", "server tidak dihubungi", { fill: M3 });
  b += arrow(342, 145, 412, 145) + arrow(762, 145, 832, 145) + lbl(797, 132, "ya", { anchor: "middle" });
  b += node(c2, 250, 340, "robots.txt mengizinkan?", "dibaca sekali per situs");
  b += node(c3, 250, 320, "DilarangRobots", "crawl berhenti, kode 2");
  b += arrow(590, 192, 590, 242) + lbl(602, 224, "tidak") + arrow(762, 295, 832, 295) + lbl(797, 282, "tidak", { anchor: "middle" });
  b += node(c2, 400, 340, "_tunggu_giliran()", "jeda sejak permintaan terakhir", { fill: M1, mono: true });
  b += node(c3, 400, 320, "GET + User-Agent", "timeout 10 dtk, connect 5");
  b += arrow(590, 342, 590, 392) + lbl(602, 374, "ya") + arrow(762, 445, 832, 445);
  b += node(c2, 550, 340, "jawaban?");
  b += path([[1000, 492], [1000, 595], [768, 595]]);
  b += node(c1, 720, 300, "404, 4xx lain", "langsung raise, tanpa retry");
  b += node(c2, 720, 340, "429, 5xx, timeout", "tunggu 1, 2 dtk / Retry-After", { fill: M1 });
  b += node(c3, 720, 320, "200 OK", "simpan cache, kembalikan HTML", { fill: M3 });
  b += path([[500, 642], [190, 712]]) + path([[590, 642], [590, 712]]) + path([[680, 642], [1000, 712]]);
  b += path([[418, 765], [380, 765], [380, 445], [412, 445]]) + text(366, 600, "coba lagi", { size: 18, weight: 700, anchor: "end" }) + text(366, 624, "maks 3x", { size: 18, weight: 700, anchor: "end" });
  b += note(860, "Percobaan ketiga tetap gagal: galatnya dilempar, buku itu dicatat sebagai buku_gagal.");
  return frame("Urutan pemeriksaan di Pengambil.ambil: cache, robots.txt, jeda, permintaan dengan User-Agent dan timeout, lalu 200 disimpan, 429/5xx/timeout dicoba lagi dengan backoff, dan 4xx lain langsung gagal", 900, b, AH);
}

const DIAGRAMS = { "alur-crawl": alur, "keputusan-pengambil": pengambil };
mkdirSync("public/studio/scraper-harga-buku", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/scraper-harga-buku/${name}.svg`, draw());
  console.log(name);
}
