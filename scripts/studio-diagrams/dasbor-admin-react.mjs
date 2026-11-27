// Diagrams for Studio Proyek "dasbor-admin-react", embedded as ![ket](/studio/dasbor-admin-react/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/dasbor-admin-react.mjs
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

// 194 products, 10 per page: only the visible slice travels.
function paginasi() {
  let b = text(600, 58, "Paginasi di server: limit dan skip", { size: 40, weight: 800, anchor: "middle" });
  b += text(60, 120, "194 produk di DummyJSON, 10 per halaman = 20 halaman", S({ size: 24, weight: 700 }));
  const x0 = 60, w = 50, gap = 4;
  for (let i = 0; i < 20; i++) {
    const x = x0 + i * (w + gap), hit = i === 2;
    b += box(x, 150, w, 90, { fill: hit ? M3 : M1, r: 8, sw: hit ? 4 : 2 });
    b += text(x + w / 2, 205, i + 1, { size: 20, weight: hit ? 800 : 500, anchor: "middle" });
  }
  b += text(x0, 275, "id 1-10", S({ size: 17 })) + text(x0 + 2 * (w + gap), 275, "id 21-30", S({ size: 17, weight: 700 })) + text(x0 + 19 * (w + gap) + w, 275, "id 191-194", S({ size: 17, anchor: "end" }));
  b += text(60, 340, "Halaman 3:", { size: 26, weight: 800 }) + mono(220, 340, "skip = (3 - 1) × 10 = 20", { size: 24, weight: 700 });
  b += box(60, 380, 1080, 70, { fill: M1, r: 16 }) + mono(84, 424, "GET /products?limit=10&skip=20&select=title,category,price,stock,rating", { size: 20 });
  b += arrow(600, 452, 600, 500);
  b += box(60, 506, 1080, 120, { r: 16 });
  b += mono(84, 546, '{ "products": [ ...10 baris... ],', { size: 21 }) + mono(84, 580, '  "total": 194, "skip": 20, "limit": 10 }', { size: 21, weight: 700 });
  b += text(1116, 600, "total ÷ limit = jumlah halaman", S({ size: 19, anchor: "end", weight: 700 }));
  b += note(680, "Server hanya mengirim 10 baris yang sedang dilihat, berapa pun total datanya.");
  return frame("Paginasi di server: dari 194 produk, halaman 3 meminta limit 10 skip 20 dan menerima 10 baris beserta total 194", 710, b, AH);
}

// Desktop vs phone layout plus the three data states.
function tataLetak() {
  let b = text(600, 58, "Sketsa tata letak dan tiga status data", { size: 40, weight: 800, anchor: "middle" });
  // desktop
  b += text(60, 110, "Layar lebar (> 720px)", S({ size: 22, weight: 800 }));
  b += box(60, 126, 700, 420, { r: 16 });
  b += `<rect x="62" y="128" width="170" height="416" rx="13" fill="${INK}"/>`;
  b += text(80, 168, "Dasbor Toko", { size: 19, weight: 800, fill: "#ffffff" });
  ["Ringkasan", "Produk", "Pengguna"].forEach((m, i) => {
    if (i === 1) b += `<rect x="74" y="${192 + i * 44}" width="146" height="34" rx="8" fill="#ffffff"/>`;
    b += text(86, 215 + i * 44, m, { size: 18, weight: 700, fill: i === 1 ? INK : "#ffffff" });
  });
  b += text(256, 170, "Produk", { size: 26, weight: 800 });
  b += box(256, 188, 330, 42, { r: 10, sw: 3 }) + text(270, 216, "Cari produk...", S({ size: 17, fill: "#6b6f63" })) + box(596, 188, 140, 42, { fill: M3, r: 10, sw: 3 }) + text(666, 216, "Cari", { size: 18, weight: 800, anchor: "middle" });
  const cols = ["Nama", "Kategori", "Harga ↓", "Stok"], cx = [270, 420, 560, 670];
  b += `<rect x="256" y="246" width="480" height="40" rx="8" fill="${M1}"/>`;
  cols.forEach((c, i) => { b += text(cx[i], 273, c, { size: 17, weight: 800 }); });
  for (let r = 0; r < 5; r++) { const y = 304 + r * 36; cx.forEach((x, i) => { b += bar(x, y, [110, 90, 60, 40][i]); }); b += line(256, y + 26, 736, y + 26, { sw: 1, stroke: "#c9cbc3" }); }
  b += text(256, 520, "‹ Sebelumnya", S({ size: 17, weight: 700 })) + text(496, 520, "Halaman 2 dari 20", S({ size: 17, anchor: "middle" })) + text(736, 520, "Berikutnya ›", S({ size: 17, weight: 700, anchor: "end" }));
  // phone
  b += text(830, 110, "HP (< 720px)", S({ size: 22, weight: 800 }));
  b += box(830, 126, 310, 420, { r: 28 });
  b += `<rect x="832" y="128" width="306" height="84" rx="26" fill="${INK}"/>`;
  b += text(852, 160, "Dasbor Toko", { size: 18, weight: 800, fill: "#ffffff" });
  b += text(852, 194, "Ringkasan  Produk  Pengguna", { size: 16, weight: 700, fill: "#ffffff" });
  b += text(852, 248, "Produk", { size: 22, weight: 800 });
  b += box(852, 262, 266, 38, { r: 10, sw: 3 });
  // The table is wider than the phone: clipped, with a horizontal scrollbar.
  let t = `<rect x="852" y="316" width="380" height="34" rx="8" fill="${M1}"/>` + text(866, 339, "Nama      Kategori   Harga", { size: 16, weight: 800 });
  for (let r = 0; r < 4; r++) t += bar(866, 368 + r * 30, 340, 12);
  b += `<g clip-path="url(#hp)">${t}</g>`;
  b += `<rect x="852" y="488" width="266" height="8" rx="4" fill="${INK}" opacity="0.12"/><rect x="852" y="488" width="150" height="8" rx="4" fill="${INK}" opacity="0.5"/>`;
  b += box(830, 126, 310, 420, { r: 28, fill: "none" });
  b += text(985, 528, "← tabel digulir ke samping →", S({ size: 16, anchor: "middle", weight: 700 }));
  // states
  const st = [["Memuat", '"Memuat data..."', 'role="status"', M1], ["Error", "pesan server", "+ tombol Coba lagi", PINK], ["Kosong", '"Tidak ada produk', 'yang cocok"', "#ffffff"]];
  st.forEach(([t, a, c, f], i) => {
    const x = 60 + i * 368;
    b += box(x, 590, 344, 130, { fill: f, r: 18 }) + text(x + 172, 632, t, { size: 24, weight: 800, anchor: "middle" }) + text(x + 172, 668, a, S({ size: 19, anchor: "middle" })) + text(x + 172, 698, c, S({ size: 19, anchor: "middle" }));
  });
  b += note(770, "Ketiga status menggantikan area tabel; sidebar dan judul halaman tetap di tempatnya.");
  return frame("Sketsa tata letak dasbor: sidebar di layar lebar, bilah atas di HP dengan tabel digulir ke samping, serta status memuat, error, dan kosong", 800, b, AH + '<clipPath id="hp"><rect x="852" y="300" width="266" height="180"/></clipPath>');
}

// The URL drives everything; clicks only write the URL.
function urlState() {
  let b = text(600, 58, "Satu putaran: URL → query → tabel → URL", { size: 40, weight: 800, anchor: "middle" });
  const node = (x, y, w, t, sub, f = "#ffffff") => box(x, y, w, 130, { fill: f, r: 18 }) + text(x + w / 2, y + 44, t, { size: 23, weight: 800, anchor: "middle" }) + sub.map((l, i) => mono(x + w / 2, y + 80 + i * 28, l, { anchor: "middle", size: 17 })).join("");
  b += node(60, 110, 480, "1. URL", ["/produk?q=phone&sort=price", "&order=desc&page=2"], M3);
  b += node(660, 110, 480, "2. useUrlParams", ["{ q, sortBy, order, page }", "pageFrom(): ?page=abc → 1"], M1);
  b += node(660, 330, 480, "3. useQuery", ['key: ["products", query]', "skip = (page - 1) × 10"], M1);
  b += node(60, 330, 480, "4. Tabel + Pagination", ["10 baris, panah ↓ di Harga", "Halaman 2 dari 20"]);
  b += arrow(542, 175, 654, 175) + arrow(900, 242, 900, 324) + arrow(658, 395, 546, 395);
  b += `<path d="M300 462 C 300 540, 120 540, 70 470 S 40 260, 120 246" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" marker-end="url(#ah)"/>`;
  b += text(330, 510, "klik kolom, tombol halaman, Cari", S({ size: 20, weight: 700 }));
  b += text(330, 538, "→ update() menulis URL baru,", S({ size: 20 })) + text(330, 566, "lalu putaran berulang", S({ size: 20 }));
  b += box(760, 490, 380, 110, { r: 18, dash: "10 8", sw: 3 }) + text(950, 532, "Back, muat ulang, bagikan", { size: 21, weight: 800, anchor: "middle" }) + text(950, 566, "langsung bekerja: semuanya", S({ size: 19, anchor: "middle" })) + text(950, 592, "hanya mengganti URL", S({ size: 19, anchor: "middle" }));
  b += note(640, "Tidak ada useState untuk filter. Kalau page lupa masuk query key,") + note(672, "TanStack Query menganggap halaman 1 dan 2 data yang sama.");
  return frame("Alur halaman produk: URL dibaca useUrlParams, menjadi query key useQuery, ditampilkan di tabel; setiap klik hanya menulis URL baru", 700, b, AH);
}

// SPA fallback: unknown paths get index.html.
function spaFallback() {
  let b = text(600, 58, "SPA fallback: kenapa /produk/5 bisa 404", { size: 40, weight: 800, anchor: "middle" });
  b += box(60, 110, 300, 100, { r: 18 }) + text(210, 152, "Browser", { size: 24, weight: 800, anchor: "middle" }) + mono(210, 186, "GET /produk/5", { anchor: "middle" });
  b += box(480, 110, 660, 100, { fill: M1, r: 18 }) + text(810, 152, "Server statis (isi folder dist)", { size: 22, weight: 800, anchor: "middle" }) + mono(810, 186, "index.html  assets/index-xxxx.js", { anchor: "middle" });
  b += arrow(362, 160, 474, 160);
  b += text(735, 272, "Ada berkas produk/5? Tidak.", { size: 21, weight: 800, anchor: "middle" });
  b += arrow(540, 212, 310, 316) + arrow(1040, 212, 960, 316);
  b += box(60, 322, 500, 180, { fill: PINK, r: 18 }) + text(310, 364, "Tanpa aturan", { size: 24, weight: 800, anchor: "middle" }) + mono(310, 404, "404 NOT_FOUND", { anchor: "middle", size: 22, weight: 700 }) + text(310, 444, "Klik dari dalam aplikasi lancar,", S({ size: 19, anchor: "middle" })) + text(310, 472, "tapi muat ulang atau tautan langsung gagal", S({ size: 19, anchor: "middle" }));
  b += box(640, 322, 500, 180, { fill: M3, r: 18 }) + text(890, 364, "Dengan rewrite", { size: 24, weight: 800, anchor: "middle" }) + mono(890, 400, "vercel.json: /(.*) → /index.html", { anchor: "middle", size: 17 }) + mono(890, 428, "_redirects: /* /index.html 200", { anchor: "middle", size: 17 }) + text(890, 472, "server menjawab index.html", S({ size: 19, anchor: "middle" }));
  b += arrow(890, 504, 890, 556);
  b += box(640, 562, 500, 100, { r: 18 }) + text(890, 604, "React Router membaca /produk/5", { size: 21, weight: 800, anchor: "middle" }) + text(890, 638, "lalu merender ProdukDetail id 5", S({ size: 19, anchor: "middle" }));
  b += text(60, 590, "Berkas yang memang ada (JS, CSS,", S()) + text(60, 620, "gambar) tetap dilayani apa adanya;", S()) + text(60, 650, "rewrite hanya untuk alamat yang", S()) + text(60, 680, "tidak cocok dengan berkas.", S());
  return frame("SPA fallback: tanpa aturan, server menjawab 404 untuk /produk/5; dengan rewrite ke index.html, React Router yang menampilkan detail produk", 710, b, AH);
}

const DIAGRAMS = { "paginasi-server": paginasi, "tata-letak": tataLetak, "url-state": urlState, "spa-fallback": spaFallback };
mkdirSync("public/studio/dasbor-admin-react", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/dasbor-admin-react/${name}.svg`, draw());
  console.log(name);
}
