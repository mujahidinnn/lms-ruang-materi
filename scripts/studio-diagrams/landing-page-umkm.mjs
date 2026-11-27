// Diagrams for Studio Proyek "landing-page-umkm", embedded as ![ket](/studio/landing-page-umkm/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/landing-page-umkm.mjs
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

const chk = (x, y, on) => `<rect x="${x}" y="${y}" width="26" height="26" rx="5" fill="${on ? "#2f6b45" : "#ffffff"}" stroke="${INK}" stroke-width="3"/>` + (on ? `<path d="M${x + 6} ${y + 13}l5 6l10 -12" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : "");
const WA = "#18733e";
const pill = (x, y, w, h, label, { fill = WA, color = "#ffffff", size = 17 } = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"/>` + text(x + w / 2, y + h / 2 + size * 0.36, label, { size, weight: 700, anchor: "middle", fill: color });
const sec = (x, y, w, h, label, fill = "#ffffff") => box(x, y, w, h, { fill, r: 10, sw: 3 }) + text(x + 14, y + 28, label, { size: 19, weight: 700 });

// Phone first, floating WA button; wide screen puts text and photo side by side.
function wireframe() {
  let b = text(600, 58, "Urutan halaman UMKM: HP dulu, lalu layar lebar", { size: 38, weight: 800, anchor: "middle" });
  const px = 70, py = 100, pw = 300;
  b += box(px, py, pw, 760, { r: 34 }) + text(px + pw / 2, py + 795, "HP (360px)", S({ anchor: "middle", weight: 700, size: 24 }));
  let y = py + 22;
  b += sec(px + 14, y, pw - 28, 44, "Kedai Teras") + text(px + pw - 28, y + 28, "Menu Lokasi", S({ size: 15, anchor: "end" }));
  y += 54;
  b += sec(px + 14, y, pw - 28, 250, "Kopi susu aren yang", M3) + text(px + 28, y + 52, "bikin balik lagi.", { size: 19, weight: 700 }) + bar(px + 28, y + 70, 200, 12);
  b += pill(px + 28, y + 96, 220, 38, "Pesan lewat WhatsApp");
  b += box(px + 28, y + 146, pw - 56, 90, { fill: "#ffffff", r: 8, sw: 2, dash: "8 6" }) + text(px + pw / 2, y + 197, "foto produk andalan", S({ size: 17, anchor: "middle" }));
  y += 262;
  b += sec(px + 14, y, pw - 28, 150, "Menu", M1);
  for (let i = 0; i < 3; i++) b += text(px + 28, y + 62 + i * 30, ["Es Kopi Susu Aren", "Kopi Tubruk", "Pisang Goreng Madu"][i], S({ size: 15 })) + text(px + pw - 30, y + 62 + i * 30, ["Rp15.000", "Rp8.000", "Rp12.000"][i], { size: 17, weight: 700, anchor: "end" });
  y += 162;
  b += sec(px + 14, y, pw - 28, 70, "Testimoni x3");
  y += 82;
  b += sec(px + 14, y, pw - 28, 100, "Alamat, jam, peta", M1);
  b += pill(px + pw - 168, py + 690, 150, 44, "Pesan via WA");
  b += `<path d="M${px + pw + 10} ${py + 712} L${px + pw + 60} ${py + 712}" stroke="${INK}" stroke-width="3"/>`;
  b += text(px + pw + 68, py + 705, "tombol melayang,", S({ size: 19, weight: 700 })) + text(px + pw + 68, py + 731, "hanya di HP (md:hidden)", S({ size: 19 }));

  const wx = 520, wy = 100, ww = 620, wh = 520;
  b += box(wx, wy, ww, wh, { r: 18 }) + line(wx, wy + 40, wx + ww, wy + 40, { sw: 3 });
  for (let i = 0; i < 3; i++) b += `<circle cx="${wx + 24 + i * 22}" cy="${wy + 20}" r="7" fill="${INK}" opacity="0.25"/>`;
  b += text(wx + ww / 2, wy + wh + 35, "Layar lebar (768px ke atas)", S({ anchor: "middle", weight: 700, size: 24 }));
  b += sec(wx + 16, wy + 54, ww - 32, 44, "Kedai Teras") + text(wx + ww - 30, wy + 82, "Menu   Lokasi", S({ size: 16, anchor: "end" }));
  b += sec(wx + 16, wy + 112, 280, 200, "Kopi susu aren yang", M3) + text(wx + 30, wy + 166, "bikin balik lagi.", { size: 19, weight: 700 }) + bar(wx + 30, wy + 186, 220, 12) + pill(wx + 30, wy + 216, 220, 38, "Pesan lewat WhatsApp");
  b += box(wx + 312, wy + 112, ww - 328, 200, { r: 10, sw: 2, dash: "8 6" }) + text(wx + 312 + (ww - 328) / 2, wy + 218, "foto produk andalan", S({ size: 18, anchor: "middle" }));
  b += sec(wx + 16, wy + 326, ww - 32, 52, "Menu dan harga (2 kolom)", M1);
  const tw = (ww - 32 - 24) / 3;
  for (let i = 0; i < 3; i++) b += box(wx + 16 + i * (tw + 12), wy + 388, tw, 46, { r: 10, sw: 3 }) + text(wx + 16 + i * (tw + 12) + tw / 2, wy + 418, `testimoni ${i + 1}`, S({ size: 17, anchor: "middle" }));
  b += sec(wx + 16, wy + 444, 280, 62, "Alamat dan jam", M1) + box(wx + 312, wy + 444, ww - 328, 62, { r: 10, sw: 3 }) + text(wx + 312 + (ww - 328) / 2, wy + 482, "peta Google Maps", S({ size: 18, anchor: "middle" }));
  b += text(wx + ww / 2, 710, "Tanpa prefiks = gaya HP. Kelas md: berlaku mulai 768px:", S({ anchor: "middle", size: 22 })) + text(wx + ww / 2, 740, "pembuka jadi dua kolom, tombol melayang disembunyikan.", S({ anchor: "middle", size: 22 }));
  return frame("Sketsa landing page UMKM di HP dan layar lebar: pembuka dengan tombol WhatsApp, menu dan harga, testimoni, lokasi, dan tombol melayang di HP", 910, b);
}

// wa.me link, piece by piece.
function tautanWa() {
  let b = text(600, 58, "Membaca tautan WhatsApp", { size: 40, weight: 800, anchor: "middle" });
  const parts = [["https://wa.me/", "#ffffff"], ["6281234567890", M3], ["?text=", "#ffffff"], ["Halo%20Kedai%20Teras%2C%20...", M1]];
  const cw = 14.5; // monospace advance at size 24
  let x = 116;
  parts.forEach(([s, fill]) => {
    const w = s.length * cw + 16;
    b += `<rect x="${x}" y="110" width="${w}" height="60" rx="8" fill="${fill}" stroke="${INK}" stroke-width="3"/>` + text(x + 8, 148, s, { size: 24, weight: 700, mono: true });
    parts[parts.indexOf(parts.find((p) => p[0] === s))].x = x; parts.find((p) => p[0] === s).w = w;
    x += w + 6;
  });
  const mid = (i) => parts[i].x + parts[i].w / 2;
  const callout = (i, cx, title, lines) => line(mid(i), 172, cx, 238, { sw: 3 }) + box(cx - 125, 240, 250, 60 + lines.length * 34, { r: 14, fill: parts[i][1] === "#ffffff" ? "#ffffff" : parts[i][1] }) + text(cx, 278, title, { size: 22, weight: 800, anchor: "middle" }) + lines.map((l, k) => text(cx, 314 + k * 34, l, S({ size: 20, anchor: "middle", mono: l.includes("→") || l.includes("%") }))).join("");
  b += callout(0, 195, "Alamat resmi", ["selalu sama"]);
  b += callout(1, 465, "Nomor WhatsApp", ["kode negara 62,", "tanpa +, spasi, strip,", "dan tanpa 0 di depan"]);
  b += callout(2, 735, "Pesan pembuka", ["parameter text"]);
  b += callout(3, 1005, "Pesan ter-encode", ["%20 = spasi", "%2C = koma", "%3A = titik dua"]);
  b += box(70, 480, 1060, 150, { fill: "#ffffff", r: 18 });
  b += text(100, 525, "Dari nomor biasa:", { size: 22, weight: 800 }) + text(420, 525, "0812-3456-7890  →  6281234567890", { size: 24, weight: 700, mono: true });
  b += text(100, 590, "Dari kalimat biasa:", { size: 22, weight: 800 }) + text(420, 590, 'encodeURIComponent("Halo Kedai Teras, ...")', { size: 22, weight: 700, mono: true });
  b += note(680, "Tanpa encode, spasi dan tanda baca bisa memotong pesan di tengah jalan.");
  return frame("Tautan wa.me dipecah: alamat resmi, nomor dengan kode negara 62, parameter text, dan pesan yang sudah di-encode", 710, b);
}

// Tailwind CLI reads HTML and input.css, writes a small style.css.
function tailwindCli() {
  let b = text(600, 58, "Tailwind CLI: dari kelas di HTML ke style.css", { size: 40, weight: 800, anchor: "middle" });
  b += box(60, 120, 340, 150, { r: 18 }) + text(230, 165, "public/index.html", { size: 22, weight: 800, anchor: "middle", mono: true }) + text(230, 205, 'class="bg-krem', { size: 19, weight: 600, anchor: "middle", mono: true }) + text(230, 235, 'text-kopi md:grid"', { size: 19, weight: 600, anchor: "middle", mono: true });
  b += box(60, 300, 340, 150, { fill: M1, r: 18 }) + text(230, 345, "src/input.css", { size: 22, weight: 800, anchor: "middle", mono: true }) + text(230, 385, '@import "tailwindcss";', { size: 18, weight: 600, anchor: "middle", mono: true }) + text(230, 415, "@theme { --color-... }", { size: 18, weight: 600, anchor: "middle", mono: true });
  b += box(470, 220, 280, 140, { fill: M3, r: 18 }) + text(610, 275, "tailwindcss", { size: 26, weight: 800, anchor: "middle", mono: true }) + text(610, 315, "memindai kelas", S({ anchor: "middle", size: 20 }));
  b += arrow(402, 195, 464, 260) + arrow(402, 375, 464, 320);
  b += box(820, 220, 320, 140, { r: 18 }) + text(980, 270, "public/style.css", { size: 22, weight: 800, anchor: "middle", mono: true }) + text(980, 308, "hanya kelas yang dipakai", S({ anchor: "middle", size: 20 })) + text(980, 336, "jangan diedit tangan", S({ anchor: "middle", size: 18 }));
  b += arrow(752, 290, 814, 290);
  const row = (y, cmd, desc) => text(100, y, cmd, { size: 22, weight: 700, mono: true }) + text(470, y, desc, S({ size: 22 }));
  b += box(60, 490, 1080, 130, { r: 18 }) + row(540, "npm run dev", "--watch: tulis ulang style.css tiap kamu menyimpan berkas") + row(590, "npm run build", "--minify: versi ringkas untuk tayang (dijalankan Netlify)");
  b += note(668, "style.css masuk .gitignore karena berkas hasil. Ubah warna di input.css saja.");
  return frame("Tailwind CLI membaca kelas di index.html dan tema di src/input.css, lalu menulis public/style.css yang hanya berisi kelas terpakai", 700, b, AH);
}

// What a chat app shows when the link is shared, and which tag feeds each part.
function pratinjauOg() {
  let b = text(600, 58, "Pratinjau tautan dibangun dari tag Open Graph", { size: 38, weight: 800, anchor: "middle" });
  // Chat bubble
  b += box(70, 110, 470, 560, { fill: M1, r: 26 }) + text(305, 150, "Chat WhatsApp", { size: 20, weight: 700, anchor: "middle" });
  b += box(110, 175, 400, 470, { r: 18, sw: 3 });
  b += `<rect x="126" y="191" width="368" height="193" rx="10" fill="#e9d8c4" stroke="${INK}" stroke-width="2"/>` + text(310, 280, "og.jpg", { size: 24, weight: 800, anchor: "middle" }) + text(310, 312, "1200 x 630", S({ size: 20, anchor: "middle" }));
  b += text(130, 420, "Kedai Teras | Kopi Susu Aren", { size: 19, weight: 800 }) + text(130, 444, "di Sleman", { size: 19, weight: 800 });
  b += text(130, 480, "Kopi susu aren dan roti bakar", S({ size: 18 })) + text(130, 504, "mulai Rp8.000. Pesan lewat...", S({ size: 18 }));
  b += text(130, 538, "kedai-teras.netlify.app", S({ size: 17 }));
  b += line(126, 560, 494, 560, { sw: 2 }) + text(130, 600, "Cek menunya di sini ya", S({ size: 19 }));
  // Tags
  const tag = (y, t, ty) => box(640, y - 34, 500, 52, { r: 10, sw: 3 }) + text(658, y, t, { size: 19, weight: 700, mono: true }) + line(500, ty, 636, y - 8, { sw: 3, dash: "6 6" });
  b += tag(290, 'og:image (alamat https://)', 290);
  b += tag(420, "og:title", 430);
  b += tag(496, "og:description", 492);
  b += tag(560, "og:url", 534);
  b += note(720, "Tanpa tag ini, aplikasi chat menebak sendiri atau hanya menampilkan alamat polos.");
  b += note(758, "og:image wajib alamat lengkap; setelah diubah, cek ulang dengan Sharing Debugger.");
  return frame("Pratinjau tautan di WhatsApp: gambar dari og:image, judul dari og:title, deskripsi dari og:description, alamat dari og:url", 790, b);
}

// From push to published: Netlify builds style.css itself.
function alurNetlify() {
  let b = text(600, 58, "Setiap push: Netlify membangun lalu menayangkan", { size: 38, weight: 800, anchor: "middle" });
  const node = (x, w, title, lines, fill = "#ffffff") => box(x, 120, w, 210, { fill, r: 18 }) + text(x + w / 2, 166, title, { size: 25, weight: 800, anchor: "middle" }) + lines.map((l, i) => text(x + w / 2, 210 + i * 32, l, { size: 19, weight: 600, anchor: "middle", mono: /[./=]/.test(l) })).join("");
  b += node(40, 250, "Laptop", ["index.html", "src/input.css", "netlify.toml"]);
  b += node(340, 230, "GitHub", ["repositori", "tanpa style.css"], M1);
  b += node(620, 270, "Netlify build", ["npm install", "npm run build", "→ public/style.css"], M3);
  b += node(940, 220, "Tayang", ["isi folder", "public/"]);
  b += arrow(292, 225, 334, 225) + arrow(572, 225, 614, 225) + arrow(892, 225, 934, 225);
  b += text(313, 365, "git push", { size: 20, weight: 700, mono: true, anchor: "middle" });
  b += box(150, 395, 420, 150, { fill: M1, r: 16 }) + text(170, 432, "netlify.toml", { size: 21, weight: 800, mono: true }) + text(170, 466, "[build]", { size: 18, weight: 600, mono: true }) + text(196, 494, 'command = "npm run build"', { size: 18, weight: 600, mono: true }) + text(196, 522, 'publish = "public"', { size: 18, weight: 600, mono: true });
  b += box(640, 420, 480, 70, { fill: M1, r: 35 }) + text(880, 464, "https://kedai-teras.netlify.app", { size: 22, weight: 700, mono: true, anchor: "middle" });
  b += note(590, "Kalau build gagal, situs lama tetap tayang. Buka log deploy di Netlify untuk melihat sebabnya.");
  return frame("Alur deploy Netlify: git push ke GitHub, Netlify menjalankan npm run build sesuai netlify.toml, lalu menayangkan folder public", 625, b, AH);
}

const DIAGRAMS = { "tata-letak-hp-dan-lebar": wireframe, "tautan-whatsapp": tautanWa, "tailwind-cli": tailwindCli, "pratinjau-open-graph": pratinjauOg, "alur-netlify": alurNetlify };
mkdirSync("public/studio/landing-page-umkm", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/landing-page-umkm/${name}.svg`, draw());
  console.log(name);
}
