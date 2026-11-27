// Diagrams for Studio Proyek "mesin-pencari-dokumen", same look as scripts/praktik.mjs.
//   node scripts/studio-diagrams/mesin-pencari-dokumen.mjs
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
const AH = '<marker id="ah" markerWidth="14" markerHeight="14" refX="11" refY="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L14 7L0 14z" fill="#0f100d"/></marker>';
const arrow = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="5" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""} marker-end="url(#ah)"/>`;
const S = (o = {}) => ({ size: 22, weight: 500, ...o });
const note = (y, s, w = 500) => text(600, y, s, { size: 24, anchor: "middle", weight: w });
const node = (x, y, w, h, title, lines = [], fill = "#ffffff", mono = false) =>
  box(x - w / 2, y, w, h, { fill, r: 16 }) + text(x, y + 38, title, { size: 25, weight: 800, anchor: "middle" }) +
  lines.map((l, i) => text(x, y + 72 + i * 28, l, S({ anchor: "middle", mono, size: 21 }))).join("");

// 1. Dari berkas ke indeks: ingest, potongan, bobot, konfigurasi teks.
function ingest() {
  let b = text(600, 60, "Dari berkas bantuan ke indeks pencarian", { size: 40, weight: 800, anchor: "middle" });
  b += node(150, 100, 240, 150, "Berkas", [".md (front matter)", ".html (meta)"], M1);
  b += node(450, 100, 260, 150, "HTML bersih", ["marked: md -> html", "buang nav, script,", "footer, aside"]);
  b += node(760, 100, 260, 150, "Potongan", ["satu per h2 / h3", "maks 1.500 karakter", "+ anchor #bagian"]);
  b += node(1050, 100, 220, 150, "Upsert", ["hash isi sama:", "dilewati"], M1);
  b += arrow(270, 175, 312, 175) + arrow(580, 175, 622, 175) + arrow(890, 175, 932, 175);

  b += text(60, 320, "Kolom generated tsv (dihitung Postgres saat INSERT/UPDATE)", { size: 28, weight: 800 });
  const rows = [["A", "judul dokumen", "bobot 1,0", M3], ["B", "subjudul (h2 › h3)", "bobot 0,4", M1], ["C", "isi potongan", "bobot 0,2", "#ffffff"]];
  rows.forEach(([w, what, val, fill], i) => {
    const y = 345 + i * 70;
    b += box(60, y, 70, 54, { fill, r: 12, sw: 3 }) + text(95, y + 38, w, { size: 28, weight: 800, anchor: "middle" });
    b += text(155, y + 36, what, S({ size: 24, weight: 600 })) + text(560, y + 36, val, S({ size: 24, anchor: "end" }));
  });
  b += box(620, 345, 520, 194, { fill: M1, r: 16 });
  b += text(880, 390, "Indeks GIN pada tsv", { size: 26, weight: 800, anchor: "middle" });
  b += text(880, 428, "leksem -> daftar baris", S({ anchor: "middle", size: 22 }));
  b += text(880, 466, "'password' -> 12, 13, 57, ...", S({ anchor: "middle", mono: true, size: 21 }));
  b += text(880, 504, "@@ mencari tanpa membaca tabel", S({ anchor: "middle", size: 22 }));

  b += text(60, 610, "Konfigurasi teks idn: satu kata melewati tiga kamus berurutan", { size: 28, weight: 800 });
  const steps = [["unaccent", "café -> cafe", "#ffffff"], ["idn_sinonim", "sandi -> password", M1], ["idn_kata", "huruf kecil,", M3]];
  steps.forEach(([t, ex, fill], i) => {
    const x = 60 + i * 300;
    b += box(x, 640, 260, 110, { fill, r: 16 }) + text(x + 130, 682, t, { size: 24, weight: 800, anchor: "middle", mono: true });
    b += text(x + 130, 720, ex, S({ anchor: "middle", size: 21 }));
    if (i === 2) b += text(x + 130, 744, "stopword dibuang", S({ anchor: "middle", size: 21 }));
    if (i < 2) b += arrow(x + 262, 695, x + 296, 695);
  });
  b += arrow(922, 695, 956, 695);
  b += box(960, 640, 180, 110, { r: 16 }) + text(1050, 682, "leksem", { size: 24, weight: 800, anchor: "middle" });
  b += text(1050, 720, "tanpa stem", S({ anchor: "middle", size: 21 }));
  b += box(60, 785, 1080, 70, { r: 14, sw: 3 });
  b += text(600, 829, "\"Cara ganti kata sandi di HP\"  ->  'ganti':2  'password':4  'ponsel':6", { size: 24, weight: 600, anchor: "middle", mono: true });
  b += note(900, "Ubah kamus = bangun ulang image db dan isi ulang data: tsv yang tersimpan tidak ikut berubah.");
  return frame("Alur ingest berkas Markdown dan HTML menjadi potongan, kolom tsv berbobot A B C dengan indeks GIN, dan rantai kamus konfigurasi teks idn", 940, b, AH);
}

// 2. Alur satu request /cari.
function alurCari() {
  let b = text(600, 60, "Satu request GET /cari, dari atas ke bawah", { size: 40, weight: 800, anchor: "middle" });
  const L = 330, R = 900;
  b += node(L, 95, 420, 105, "Validasi + rate limit", ["skema Fastify, 60 req/menit per IP"]);
  b += node(L, 240, 420, 105, "Cache LRU 60 detik", ["hit: kembalikan, x-cache: hit"], M1);
  b += node(L, 385, 420, 105, "1. websearch_to_tsquery", ["semua kata wajib (AND)"]);
  b += node(L, 530, 420, 105, "2. Maksud Anda (pg_trgm)", ["kata tak dikenal -> terdekat"], M1);
  b += node(L, 675, 420, 105, "3. Sebagian kata (OR)", ["kalau tetap nol hasil"]);
  for (const y of [200, 345, 490, 635]) b += arrow(L, y, L, y + 36);
  for (const y of [200, 345, 490, 635]) b += text(L + 14, y + 26, y === 200 ? "lolos" : y === 345 ? "miss" : "0 hasil", S({ size: 20 }));
  b += text(L + 225, 427, "ada hasil", S({ size: 20 }));
  b += arrow(L + 210, 437, R - 210, 437) + arrow(L + 210, 582, R - 210, 520, { dash: "10 10" }) + arrow(L + 210, 727, R - 210, 560, { dash: "10 10" });

  b += node(R, 385, 420, 200, "Ranking + halaman", ["kata umum? saring dari judul dulu", "skor = ts_rank x kesegaran x klik", "DISTINCT ON doc: potongan terbaik", "keyset: (skor, id) < cursor"], M3);
  b += arrow(R, 585, R, 660);
  b += node(R, 665, 420, 115, "ts_headline -> escape", ["penanda \\u0002 -> <mark>"]);
  b += arrow(R, 780, R, 822);
  b += node(R, 825, 420, 95, "JSON + facet + log", []);
  b += text(R, 900, "hasil, berikutnya, total, facet", S({ anchor: "middle", size: 20 }));
  b += node(L, 825, 420, 95, "Metrik /metrics", []);
  b += text(L, 900, "histogram durasi, label cache", S({ anchor: "middle", size: 20 }));
  b += arrow(R - 210, 872, L + 214, 872, { dash: "10 10" });
  return frame("Alur request pencarian: validasi dan rate limit, cache, kueri AND, koreksi ejaan trigram, fallback OR, ranking dengan keyset, cuplikan aman, lalu JSON dan metrik", 950, b, AH);
}

// 3. Hasil tuning: EXPLAIN satu kueri lebar dan p95 bench (angka dari verifikasi, laptop + Postgres 384 MB).
function performa() {
  let b = text(600, 60, "Dua perbaikan, diukur: 100 ribu dokumen", { size: 40, weight: 800, anchor: "middle" });
  const panel = (y, judul, sub, rows, max, unit) => {
    let s = text(60, y, judul, { size: 28, weight: 800 }) + text(1140, y, sub, S({ anchor: "end", size: 21 }));
    rows.forEach(([label, v, extra, fill], i) => {
      const yy = y + 28 + i * 78, w = Math.max(8, (v / max) * 500);
      s += text(60, yy + 40, label, S({ size: 22, weight: 600 }));
      s += box(400, yy + 8, w, 46, { fill, r: 10, sw: 3 });
      s += text(400 + w + 14, yy + 40, `${v.toLocaleString("id-ID")} ${unit}${extra}`, S({ size: 22, weight: 700 }));
    });
    return s;
  };
  b += panel(130, "EXPLAIN ANALYZE kueri \"produk\"", "32.185 potongan cocok", [
    ["ts_rank_cd, semua baris", 2000, "", "#ffffff"],
    ["ts_rank, semua baris", 550, "", M1],
    ["ts_rank, saring judul", 25, " · 1.586 baris", M3],
  ], 2000, "ms");
  b += panel(440, "p95 bench, 4 klien paralel", "400 request, cache aplikasi dingin", [
    ["naif (ts_rank_cd)", 2008, " · 20 galat", "#ffffff"],
    ["ts_rank", 916, " · 0 galat", M1],
    ["ts_rank + saringan", 315, " · 0 galat", M3],
  ], 2008, "ms");
  b += note(745, "Kualitas tetap: nDCG@10 0,886 dengan dan tanpa saringan (25 kueri, 100 ribu pengecoh).");
  b += note(782, "Angka dari satu laptop; urutannya yang penting, bukan nilai mutlaknya.");
  return frame("Grafik batang hasil tuning: waktu EXPLAIN ANALYZE turun dari 2000 ke 550 ke 25 milidetik, p95 bench turun dari 2008 ke 916 ke 315 milidetik dengan galat dari 20 menjadi 0", 820, b, AH);
}

mkdirSync("public/studio/mesin-pencari-dokumen", { recursive: true });
for (const [name, svg] of Object.entries({ "ingest-indeks": ingest(), "alur-cari": alurCari(), "performa": performa() })) {
  writeFileSync(`public/studio/mesin-pencari-dokumen/${name}.svg`, svg);
  console.log(`public/studio/mesin-pencari-dokumen/${name}.svg`);
}
