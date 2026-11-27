// Diagrams for Studio Proyek "portofolio", embedded as ![ket](/studio/portofolio/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/portofolio.mjs
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

// Same page, two widths: phone stacks everything, wide screen centres a column.
function wireframe() {
  let b = text(600, 58, "Satu halaman, dua lebar layar", { size: 40, weight: 800, anchor: "middle" });
  // Phone
  const px = 80, py = 100, pw = 300;
  b += box(px, py, pw, 700, { r: 34 }) + text(px + pw / 2, py + 735, "HP (360px)", S({ anchor: "middle", weight: 700, size: 24 }));
  const sec = (x, y, w, h, label, fill = "#ffffff") => box(x, y, w, h, { fill, r: 10, sw: 3 }) + text(x + 14, y + 30, label, { size: 20, weight: 700 });
  let y = py + 24;
  b += sec(px + 16, y, pw - 32, 52, "Nama", "#ffffff") + text(px + pw - 30, y + 32, "Proyek  Kontak", S({ size: 16, anchor: "end" }));
  y += 64;
  b += sec(px + 16, y, pw - 32, 170, "Halo, aku Rani.", M3) + bar(px + 30, y + 52, 200) + bar(px + 30, y + 76, 160);
  b += `<rect x="${px + 30}" y="${y + 110}" width="140" height="40" rx="20" fill="${INK}"/>` + text(px + 100, y + 136, "Hubungi aku", { size: 17, anchor: "middle", fill: "#ffffff" });
  y += 182;
  b += sec(px + 16, y, pw - 32, 250, "Proyek", M1);
  for (let i = 0; i < 3; i++) b += box(px + 30, y + 46 + i * 66, pw - 60, 54, { r: 8, sw: 3 }) + bar(px + 44, y + 66 + i * 66, 150, 12);
  y += 262;
  b += sec(px + 16, y, pw - 32, 64, "Keahlian", "#ffffff");
  y += 76;
  b += sec(px + 16, y, pw - 32, 58, "Kontak", M1);

  // Wide screen
  const wx = 470, wy = 100, ww = 660, wh = 560;
  b += box(wx, wy, ww, wh, { r: 18 }) + line(wx, wy + 40, wx + ww, wy + 40, { sw: 3 });
  for (let i = 0; i < 3; i++) b += `<circle cx="${wx + 24 + i * 22}" cy="${wy + 20}" r="7" fill="${INK}" opacity="0.25"/>`;
  b += text(wx + ww / 2, wy + wh + 35, "Layar lebar (1200px)", S({ anchor: "middle", weight: 700, size: 24 }));
  const cx = wx + 150, cw = 360; // centred column, max-width 40rem
  b += line(cx, wy + 60, cx, wy + wh - 16, { sw: 2, dash: "6 8" }) + line(cx + cw, wy + 60, cx + cw, wy + wh - 16, { sw: 2, dash: "6 8" });
  b += sec(wx + 16, wy + 52, ww - 32, 46, "Nama") + text(wx + ww - 30, wy + 82, "Proyek   Kontak", S({ size: 17, anchor: "end" }));
  b += sec(cx, wy + 112, cw, 150, "Halo, aku Rani.", M3) + bar(cx + 14, wy + 160, 240) + bar(cx + 14, wy + 184, 190);
  b += `<rect x="${cx + 14}" y="${wy + 208}" width="140" height="38" rx="19" fill="${INK}"/>` + text(cx + 84, wy + 233, "Hubungi aku", { size: 17, anchor: "middle", fill: "#ffffff" });
  b += sec(cx, wy + 276, cw, 140, "Proyek", M1);
  for (let i = 0; i < 2; i++) b += box(cx + 14 + i * 172, wy + 322, 160, 80, { r: 8, sw: 3 }) + bar(cx + 28 + i * 172, wy + 344, 110, 12);
  b += sec(cx, wy + 430, cw, 50, "Keahlian") + sec(cx, wy + 492, cw, 50, "Kontak", M1);
  b += text(cx - 16, wy + 330, "kolom", S({ anchor: "end", size: 19 })) + text(cx - 16, wy + 354, "max-width", S({ anchor: "end", size: 19, mono: true })) + text(cx - 16, wy + 378, "40rem", S({ anchor: "end", size: 19, mono: true }));

  b += note(870, "Urutan bagian sama di kedua layar: yang paling penting (perkenalan dan tombol) paling atas.");
  b += note(908, "Di layar lebar isi tetap di kolom tengah yang sempit supaya kalimat tidak terlalu panjang dibaca.");
  return frame("Sketsa tata letak portofolio di HP dan di layar lebar: header, perkenalan dengan tombol, proyek, keahlian, kontak", 940, b);
}

// Mobile first: base CSS for every width, one media query from 48rem up.
function mobileFirst() {
  let b = text(600, 58, "Mobile first: gaya dasar dulu, media query menambah", { size: 38, weight: 800, anchor: "middle" });
  // Ruler
  const x0 = 80, x1 = 1120, scale = (x1 - x0) / 1400;
  const X = (px) => x0 + px * scale;
  b += line(x0, 140, x1, 140, { sw: 4 });
  for (const [px, l] of [[0, "0"], [360, "360px"], [768, "768px = 48rem"], [1200, "1200px"]]) b += line(X(px), 128, X(px), 152, { sw: 4 }) + text(X(px), 116, l, S({ anchor: px === 0 ? "start" : "middle", size: 21, weight: 700 }));
  b += `<rect x="${X(0)}" y="168" width="${X(1400) - X(0)}" height="64" rx="12" fill="${M1}" stroke="${INK}" stroke-width="3"/>`;
  b += text(X(0) + 20, 210, "Gaya dasar (tanpa media query): berlaku di semua lebar", { size: 22, weight: 700 });
  b += `<rect x="${X(768)}" y="248" width="${X(1400) - X(768)}" height="64" rx="12" fill="${M3}" stroke="${INK}" stroke-width="3"/>`;
  b += text(X(768) + 20, 290, "@media (min-width: 48rem) { ... }", { size: 22, weight: 700, mono: true });
  b += line(X(768), 232, X(768), 248, { sw: 3, dash: "6 8" });
  // Two result panels
  const panel = (x, w, title, h1, cols) => {
    let s = box(x, 360, w, 330, { r: 18 }) + text(x + w / 2, 400, title, { size: 24, weight: 800, anchor: "middle" });
    s += text(x + 24, 450, ".hero h1", { size: 20, weight: 700, mono: true }) + text(x + w - 24, 450, h1, { size: 20, weight: 700, mono: true, anchor: "end" });
    s += text(x + 24, 490, ".proyek-grid", { size: 20, weight: 700, mono: true }) + text(x + w - 24, 490, cols === 1 ? "1 kolom" : "2 kolom", { size: 20, weight: 700, anchor: "end" });
    const cw = cols === 1 ? w - 48 : (w - 64) / 2;
    for (let i = 0; i < 2; i++) {
      const cx = cols === 1 ? x + 24 : x + 24 + i * (cw + 16), cy = cols === 1 ? 515 + i * 82 : 515;
      s += box(cx, cy, cw, 70, { fill: M1, r: 10, sw: 3 }) + text(cx + cw / 2, cy + 43, `kartu ${i + 1}`, S({ anchor: "middle" }));
    }
    return s;
  };
  b += panel(80, 400, "Di bawah 768px", "2.25rem", 1) + panel(560, 560, "Mulai 768px ke atas", "3.25rem", 2);
  b += note(740, "Tulis dulu untuk HP. Media query hanya menimpa yang berubah di layar lebar.");
  b += note(778, "Uji di DevTools pada 360px, 768px, dan 1200px: di 768px kartu proyek mulai berjajar dua.");
  return frame("Pendekatan mobile first: gaya dasar berlaku di semua lebar, media query min-width 48rem menambah ukuran judul dan grid dua kolom", 810, b);
}

// From git push to a public address.
function githubPages() {
  let b = text(600, 58, "Dari git push sampai alamat publik", { size: 40, weight: 800, anchor: "middle" });
  const node = (x, w, title, lines, fill = "#ffffff") => box(x, 120, w, 200, { fill, r: 18 }) + text(x + w / 2, 168, title, { size: 26, weight: 800, anchor: "middle" }) + lines.map((l, i) => text(x + w / 2, 212 + i * 32, l, S({ anchor: "middle", size: 20, mono: l.includes("/") || l.includes(".") }))).join("");
  b += node(40, 240, "Laptopmu", ["index.html", "style.css", "README.md"]);
  b += node(340, 240, "Repositori", ["GitHub", "branch main", "folder / (root)"], M1);
  b += node(640, 240, "GitHub Pages", ["menyalin berkas", "ke server web", "1-2 menit"], M3);
  b += node(940, 220, "Pengunjung", ["browser di HP", "atau laptop"]);
  b += arrow(282, 220, 334, 220) + arrow(582, 220, 634, 220) + arrow(882, 220, 934, 220);
  b += text(308, 360, "git push", { size: 22, weight: 700, mono: true, anchor: "middle" });
  b += text(608, 360, "Settings → Pages", S({ anchor: "middle", size: 20, weight: 700 }));
  b += box(200, 400, 800, 70, { fill: M1, r: 35 }) + text(600, 445, "https://USERNAME.github.io/portofolio/", { size: 26, weight: 700, mono: true, anchor: "middle" });
  b += note(520, "Setiap git push berikutnya otomatis memperbarui situs. Nama berkas peka huruf besar-kecil:");
  b += note(556, "Style.css dan style.css dianggap dua berkas berbeda di server.");
  return frame("Alur GitHub Pages: berkas di laptop dikirim dengan git push ke repositori, GitHub Pages menayangkannya di alamat USERNAME.github.io", 590, b, AH);
}

const DIAGRAMS = { "tata-letak-hp-dan-lebar": wireframe, "mobile-first": mobileFirst, "alur-github-pages": githubPages };
mkdirSync("public/studio/portofolio", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/portofolio/${name}.svg`, draw());
  console.log(name);
}
