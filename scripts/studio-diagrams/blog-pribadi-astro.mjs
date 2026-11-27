// Diagrams for Studio Proyek "blog-pribadi-astro", embedded as ![ket](/studio/blog-pribadi-astro/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/blog-pribadi-astro.mjs
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

// Markdown -> schema -> ambilTulisan() -> every generated page.
function petaHalaman() {
  let b = text(600, 58, "Satu folder Markdown, banyak halaman", { size: 40, weight: 800, anchor: "middle" });
  // Files
  b += box(40, 110, 300, 250, { r: 18 }) + text(190, 150, "src/content/blog", { size: 22, weight: 800, anchor: "middle", mono: true });
  ["halo-dunia.md", "css-grid-untuk-pemula.md", "rencana-belajar-git.md"].forEach((f, i) => {
    b += box(60, 172 + i * 60, 260, 46, { r: 10, sw: 3, fill: i === 2 ? "#ffffff" : M1, dash: i === 2 ? "8 6" : undefined }) + text(72, 201 + i * 60, f, { size: 15.5, weight: 600, mono: true });
  });
  b += text(190, 390, "draft: true (garis putus)", S({ anchor: "middle", size: 19 }));
  // Schema
  b += arrow(342, 235, 392, 235);
  b += box(398, 140, 300, 190, { fill: M3, r: 18 }) + text(548, 182, "Skema Zod", { size: 26, weight: 800, anchor: "middle" });
  ["title, date,", "description,", "tags, draft"].forEach((l, i) => (b += text(548, 222 + i * 30, l, S({ anchor: "middle", size: 21, mono: true }))));
  b += text(548, 372, "salah ketik = build gagal", S({ anchor: "middle", size: 19, weight: 700 }));
  // ambilTulisan
  b += arrow(700, 235, 750, 235);
  b += box(756, 140, 400, 190, { r: 18 }) + text(956, 182, "ambilTulisan()", { size: 26, weight: 800, anchor: "middle", mono: true });
  ["buang draf (kecuali dev)", "urutkan: terbaru di atas"].forEach((l, i) => (b += text(956, 228 + i * 34, l, S({ anchor: "middle", size: 21 }))));
  // Outputs
  const outs = [
    ["/", "index.astro", "daftar tulisan"],
    ["/blog/[id]/", "blog/[id].astro", "1 halaman per tulisan"],
    ["/tag/[tag]/", "tag/[tag].astro", "1 halaman per tag"],
    ["/rss.xml", "rss.xml.ts", "feed RSS"],
    ["/sitemap-*.xml", "@astrojs/sitemap", "semua halaman"],
  ];
  b += line(956, 332, 956, 420, { sw: 5 }) + line(150, 420, 1050, 420, { sw: 5 });
  outs.forEach(([u, f, d], i) => {
    const x = 40 + i * 226, w = 210, cx = x + w / 2;
    b += i < 4 ? arrow(cx, 420, cx, 462) : line(cx, 420, cx, 462, { sw: 5, dash: "8 8" });
    b += box(x, 468, w, 160, { fill: i === 4 ? "#ffffff" : M1, r: 16, dash: i === 4 ? "10 8" : undefined });
    b += text(cx, 512, u, { size: 20, weight: 800, anchor: "middle", mono: true });
    b += text(cx, 552, f, S({ anchor: "middle", size: 16, mono: true }));
    b += text(cx, 592, d, S({ anchor: "middle", size: 18 }));
  });
  b += note(682, "Berkas bernama [kurung siku] memakai getStaticPaths(): satu berkas .astro, banyak halaman.");
  b += note(718, "Sitemap (garis putus) dibuat dari halaman hasil build, jadi draf otomatis tidak ikut.");
  return frame("Alur konten blog: Markdown di src/content/blog diperiksa skema Zod, ambilTulisan membuang draf dan mengurutkan, lalu dipakai beranda, halaman tulisan, halaman tag, RSS, dan sitemap", 760, b, AH);
}

// Why the theme flashes, and how the inline head script prevents it.
function temaTanpaKedip() {
  let b = text(600, 58, "Kenapa tema bisa berkedip putih", { size: 40, weight: 800, anchor: "middle" });
  const row = (y, title, steps, good) => {
    let s = text(40, y - 18, title, { size: 24, weight: 800 });
    let x = 40;
    steps.forEach(([label, fill, w], i) => {
      s += box(x, y, w, 96, { fill, r: 14, sw: 3 });
      label.split("\n").forEach((l, j) => (s += text(x + w / 2, y + 42 + j * 28, l, S({ anchor: "middle", size: 20, weight: j ? 500 : 700, fill: fill === INK ? "#ffffff" : INK }))));
      x += w;
      if (i < steps.length - 1) { s += arrow(x + 4, y + 48, x + 30, y + 48); x += 36; }
    });
    s += text(1160, y + 58, good ? "tanpa kedip" : "KEDIP", { size: 24, weight: 800, anchor: "end", fill: good ? INK : "#b42318" });
    return s;
  };
  b += row(140, "Tanpa skrip di head", [["HTML + CSS\ndimuat", "#ffffff", 200], ["Layar digambar\nTERANG", "#ffffff", 210], ["JS di akhir\nhalaman jalan", "#ffffff", 210], ["Ganti ke\ngelap", INK, 180]], false);
  b += row(370, "Dengan <script is:inline> di <head>", [["Skrip kecil\nbaca localStorage", M3, 230], ["<html data-tema=\n\"gelap\">", M1, 220], ["Layar langsung\ndigambar GELAP", INK, 230]], true);
  b += box(40, 540, 1120, 150, { fill: M1, r: 16, sw: 3 });
  b += text(64, 582, "Urutan pilihan tema:", { size: 22, weight: 800 });
  b += text(64, 620, "1. tersimpan di localStorage ('tema')   2. kalau belum ada: prefers-color-scheme sistem", S({ size: 21 }));
  b += text(64, 656, "Tombol tema (skrip biasa, boleh berjalan belakangan) hanya membalik dan menyimpan pilihan.", S({ size: 21 }));
  return frame("Perbandingan: tanpa skrip inline di head layar sempat tergambar terang lalu berganti gelap; dengan skrip inline data-tema dipasang sebelum layar digambar", 720, b, AH);
}

// site + base = public address; url() adds base to internal links.
function siteDanBase() {
  let b = text(600, 58, "site + base = alamat blogmu", { size: 40, weight: 800, anchor: "middle" });
  const y = 120, h = 80;
  b += box(60, y, 470, h, { fill: M1, r: 14 }) + text(295, y + 50, "https://USERNAME.github.io", { size: 24, weight: 700, anchor: "middle", mono: true });
  b += box(530, y, 250, h, { fill: M3, r: 14 }) + text(655, y + 50, "/blog-astro", { size: 24, weight: 700, anchor: "middle", mono: true });
  b += box(780, y, 360, h, { r: 14 }) + text(960, y + 50, "/blog/halo-dunia/", { size: 24, weight: 700, anchor: "middle", mono: true });
  b += text(295, y + 120, "site", { size: 26, weight: 800, anchor: "middle", mono: true }) + text(295, y + 152, "domain GitHub Pages", S({ anchor: "middle" }));
  b += text(655, y + 120, "base", { size: 26, weight: 800, anchor: "middle", mono: true }) + text(655, y + 152, "= nama repositori", S({ anchor: "middle" }));
  b += text(960, y + 120, "halaman", { size: 26, weight: 800, anchor: "middle" }) + text(960, y + 152, "dari src/pages", S({ anchor: "middle" }));
  // Link comparison
  b += box(60, 330, 520, 230, { r: 18 }) + text(320, 372, "Tautan ditulis biasa", { size: 24, weight: 800, anchor: "middle" });
  b += text(320, 420, "href=\"/tentang/\"", { size: 22, weight: 600, anchor: "middle", mono: true });
  b += arrow(320, 440, 320, 478) + text(320, 512, "USERNAME.github.io/tentang/", { size: 19, weight: 600, anchor: "middle", mono: true });
  b += text(320, 546, "404: base hilang", { size: 22, weight: 800, anchor: "middle", fill: "#b42318" });
  b += box(620, 330, 520, 230, { fill: M1, r: 18 }) + text(880, 372, "Tautan lewat url()", { size: 24, weight: 800, anchor: "middle" });
  b += text(880, 420, "href={url('/tentang/')}", { size: 22, weight: 600, anchor: "middle", mono: true });
  b += arrow(880, 440, 880, 478) + text(880, 512, "…github.io/blog-astro/tentang/", { size: 19, weight: 600, anchor: "middle", mono: true });
  b += text(880, 546, "terbuka", { size: 22, weight: 800, anchor: "middle" });
  b += note(606, "CSS, JavaScript, dan gambar hasil build otomatis diberi base oleh Astro.");
  b += note(640, "Tautan yang kamu tulis sendiri tidak, jadi selalu lewat url().");
  b += note(674, "Repositori bernama USERNAME.github.io atau domain sendiri? base tidak diperlukan.");
  return frame("Alamat GitHub Pages terdiri dari site (domain) dan base (nama repositori). Tautan tanpa base berakhir 404, tautan lewat url() terbuka", 710, b, AH);
}

const DIAGRAMS = { "peta-halaman": petaHalaman, "tema-tanpa-kedip": temaTanpaKedip, "site-dan-base": siteDanBase };
mkdirSync("public/studio/blog-pribadi-astro", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/blog-pribadi-astro/${name}.svg`, draw());
  console.log(name);
}
