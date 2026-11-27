// Diagrams for Studio Proyek "aplikasi-resep-vue", embedded as ![ket](/studio/aplikasi-resep-vue/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/aplikasi-resep-vue.mjs
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
const btn = (x, y, w, s, fill = INK) => `<rect x="${x}" y="${y}" width="${w}" height="40" rx="10" fill="${fill}"/>` + text(x + w / 2, y + 27, s, { size: 18, weight: 700, anchor: "middle", fill: fill === INK ? "#ffffff" : INK });
const radio = (x, y, on) => `<circle cx="${x}" cy="${y}" r="10" fill="#ffffff" stroke="${INK}" stroke-width="3"/>` + (on ? `<circle cx="${x}" cy="${y}" r="5" fill="${INK}"/>` : "");
const OUT = "public/studio/aplikasi-resep-vue";
const pill = (x, y, w, s, fill = M1) => box(x, y, w, 44, { r: 22, sw: 3, fill }) + text(x + w / 2, y + 29, s, S({ size: 19, weight: 700, anchor: "middle" }));

// From keystroke to cards: debounce, URL, useFetch with abort, findMeals intersection, four states.
function alurPencarian() {
  let b = text(600, 58, "Dari ketikan sampai kartu resep", { size: 40, weight: 800, anchor: "middle" });
  // row 1: input -> debounce -> URL
  b += box(40, 110, 300, 150) + text(64, 148, "Kotak pencarian", { size: 23, weight: 800 }) + text(64, 182, "ref text", S({ mono: true, size: 19 }));
  b += box(64, 200, 252, 40, { r: 8, sw: 2 }) + text(78, 227, "c, ch, chi ... chicken", S({ size: 18, mono: true }));
  b += box(450, 110, 300, 150, { fill: M1 }) + text(474, 148, "debounce 400 ms", { size: 23, weight: 800 });
  b += text(474, 184, "7 ketikan cepat", S({ size: 19 })) + text(474, 214, "= 1 panggilan setQuery", S({ size: 19 }));
  b += box(860, 110, 300, 150) + text(884, 148, "URL (sumber kebenaran)", { size: 21, weight: 800 });
  b += text(884, 188, "/?q=chicken", S({ mono: true, size: 19 })) + text(884, 218, "&c=Chicken&a=Japanese", S({ mono: true, size: 19 }));
  b += arrow(342, 185, 444, 185) + arrow(752, 185, 854, 185);
  b += text(1010, 290, "dropdown menulis URL langsung", S({ size: 17, anchor: "middle" }));
  // row 2: computed filters -> useFetch
  b += arrow(1010, 300, 1010, 352);
  b += box(860, 360, 300, 120) + text(884, 398, "computed filters", { size: 23, weight: 800 }) + text(884, 432, "{ q, c, a } dari", S({ size: 19 })) + text(884, 460, "route.query", S({ size: 19, mono: true }));
  b += arrow(856, 420, 760, 420);
  b += box(360, 340, 394, 160, { fill: M1 }) + text(384, 378, "useFetch(filters, findMeals)", { size: 21, weight: 800, mono: true });
  b += text(384, 414, "1. abort() request sebelumnya", S({ size: 19 }));
  b += text(384, 444, "2. loading = true", S({ size: 19 })) + text(384, 474, "3. hasil telat dibuang", S({ size: 19 }));
  b += box(40, 340, 250, 160, { dash: "10 8", sw: 3 }) + text(60, 378, "request lama", { size: 21, weight: 800 }) + text(60, 412, "search.php?s=chick", S({ size: 17, mono: true })) + text(60, 448, "AbortError: diabaikan", S({ size: 18 }));
  b += `<line x1="356" y1="420" x2="296" y2="420" stroke="${INK}" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" marker-end="url(#ah)"/>`;
  b += text(326, 404, "batal", S({ size: 16, anchor: "middle" }));
  // row 3: findMeals
  b += arrow(557, 502, 557, 552);
  b += box(40, 560, 1120, 180) + text(64, 598, "findMeals: satu request per filter, dikirim bersamaan (Promise.all)", { size: 22, weight: 800 });
  const reqs = [["search.php?s=chicken", "1, 2, 5, 7"], ["filter.php?c=Chicken", "1, 2, 3, 5"], ["filter.php?a=Japanese", "2, 5, 9"]];
  reqs.forEach(([u, ids], i) => {
    const x = 64 + i * 280;
    b += box(x, 620, 256, 96, { r: 12, sw: 3 }) + text(x + 14, 654, u, S({ size: 16, mono: true, weight: 700 })) + text(x + 14, 692, "id: " + ids, S({ size: 18 }));
  });
  b += arrow(886, 668, 944, 668);
  b += box(950, 620, 186, 96, { r: 12, fill: M3 }) + text(1043, 654, "irisan id", S({ size: 18, weight: 700, anchor: "middle" })) + text(1043, 694, "2, 5", { size: 28, weight: 800, anchor: "middle" });
  // row 4: states
  b += arrow(1043, 742, 1043, 790) ;
  const st = [["memuat", "8 kartu skeleton", "#ffffff"], ["gagal", "pesan + Coba lagi", "#ffffff"], ["kosong", "pesan + Hapus filter", "#ffffff"], ["hasil", "grid RecipeCard", M3]];
  st.forEach(([t, d, f], i) => {
    const x = 40 + i * 284;
    b += box(x, 800, 256, 96, { r: 16, fill: f }) + text(x + 128, 840, t, { size: 23, weight: 800, anchor: "middle" }) + text(x + 128, 874, d, S({ size: 18, anchor: "middle" }));
  });
  b += note(946, "Urutan v-if di template = urutan prioritas: memuat, gagal, kosong, baru hasil.");
  return frame("Alur pencarian: debounce, URL sebagai sumber kebenaran, useFetch membatalkan request lama, findMeals mengambil irisan, lalu empat keadaan tampilan", 990, b, AH);
}

// Raw lookup.php fields -> parseIngredients -> clean list.
function bahanDariApi() {
  let b = text(600, 58, "40 field mentah menjadi daftar bahan", { size: 40, weight: 800, anchor: "middle" });
  b += box(40, 100, 520, 560) + text(64, 140, "lookup.php?i=52772", { size: 22, weight: 800, mono: true });
  const rows = [
    ['"strIngredient1"', '"soy sauce"', '"strMeasure1"', '"3/4 cup"', 1],
    ['"strIngredient2"', '"water"', '"strMeasure2"', '"1/2 cup"', 1],
    ['"strIngredient3"', '"brown sugar "', '"strMeasure3"', '" 1/4 cup"', 1],
    ['"strIngredient10"', '""', '"strMeasure10"', '" "', 0],
    ['"strIngredient20"', "null", '"strMeasure20"', "null", 0],
  ];
  rows.forEach(([k1, v1, k2, v2, keep], i) => {
    const y = 170 + i * 92;
    b += box(64, y, 472, 80, { r: 10, sw: 2, fill: keep ? "#ffffff" : "#f3f3ef", dash: keep ? undefined : "8 6" });
    b += text(80, y + 32, `${k1}: ${v1}`, S({ size: 17, mono: true })) + text(80, y + 62, `${k2}: ${v2}`, S({ size: 17, mono: true }));
    if (i === 3) b += text(300, y - 4, "...", { size: 22, anchor: "middle" });
  });
  b += text(300, 650, "kosong atau null: dilewati", S({ size: 18, anchor: "middle" }));
  // function box
  b += arrow(564, 380, 650, 380);
  b += box(656, 300, 190, 160, { fill: M1 }) + text(751, 352, "parse", { size: 22, weight: 800, anchor: "middle", mono: true }) + text(751, 380, "Ingredients", { size: 22, weight: 800, anchor: "middle", mono: true });
  b += text(751, 416, "i = 1 ... 20", S({ size: 17, anchor: "middle", mono: true })) + text(751, 442, ".trim()", S({ size: 17, anchor: "middle", mono: true }));
  b += arrow(848, 380, 900, 380);
  b += box(906, 220, 254, 320) + text(926, 260, "Bahan (3)", { size: 23, weight: 800 });
  [["soy sauce", "3/4 cup"], ["water", "1/2 cup"], ["brown sugar", "1/4 cup"]].forEach(([n, m], i) => {
    const y = 290 + i * 70;
    b += line(926, y, 1140, y, { sw: 2 }) + text(926, y + 42, n, S({ size: 19 })) + text(1140, y + 42, m, S({ size: 18, anchor: "end" }));
  });
  b += text(1033, 520, "{ name, measure }[]", S({ size: 18, anchor: "middle", mono: true }));
  b += box(656, 560, 504, 100, { r: 14, dash: "10 8", sw: 3 }) + text(676, 598, 'Awas: lookup.php?i=abc menjawab', S({ size: 19 })) + text(676, 630, '{"meals": "Invalid ID"}, bukan null', S({ size: 19, mono: true }));
  b += note(712, "Komponen hanya melihat array rapi; detail API tinggal di src/api/mealdb.ts.");
  return frame("Field strIngredient1 sampai 20 dan strMeasure1 sampai 20 diubah parseIngredients menjadi daftar nama dan takaran", 750, b, AH);
}

// SPA fallback on the host.
function spaFallback() {
  let b = text(600, 58, "Refresh di /resep/52772: kenapa butuh fallback", { size: 38, weight: 800, anchor: "middle" });
  b += box(40, 120, 250, 130) + text(165, 164, "Browser", { size: 24, weight: 800, anchor: "middle" }) + text(165, 200, "GET /resep/52772", S({ size: 17, mono: true, anchor: "middle" })) + text(165, 228, "(refresh / tautan)", S({ size: 17, anchor: "middle" }));
  b += arrow(292, 185, 400, 185);
  b += box(406, 110, 330, 150, { fill: M1 }) + text(571, 152, "Netlify / Vercel", { size: 24, weight: 800, anchor: "middle" }) + text(571, 190, "ada berkas dengan", S({ size: 19, anchor: "middle" })) + text(571, 218, "nama itu di dist/?", S({ size: 19, anchor: "middle" }));
  // yes branch
  b += arrow(740, 150, 850, 150) + text(795, 136, "ya", { size: 19, weight: 800, anchor: "middle" });
  b += box(856, 100, 304, 110) + text(876, 138, "layani berkasnya", { size: 21, weight: 800 }) + text(876, 172, "/assets/index-abc.js", S({ size: 17, mono: true })) + text(876, 196, "/favicon.ico", S({ size: 17, mono: true }));
  // no branch
  b += line(571, 262, 571, 310) + text(590, 296, "tidak", { size: 19, weight: 800 });
  // without rule
  b += line(571, 310, 290, 310) + arrow(290, 310, 290, 350);
  b += box(40, 356, 500, 150, { dash: "10 8", sw: 3 }) + text(64, 396, "Tanpa aturan", { size: 23, weight: 800 });
  b += text(64, 434, "404 Page not found", S({ size: 20, mono: true })) + text(64, 470, "Vue Router tidak pernah dimuat", S({ size: 19 }));
  // with rule
  b += line(571, 310, 860, 310) + arrow(860, 310, 860, 350);
  b += box(620, 356, 540, 150, { fill: M3 }) + text(644, 396, "Dengan aturan rewrite", { size: 23, weight: 800 });
  b += text(644, 434, "/*  ->  /index.html  (200)", S({ size: 19, mono: true })) + text(644, 470, "alamat di browser tetap /resep/52772", S({ size: 19 }));
  b += arrow(890, 508, 890, 560);
  b += box(620, 566, 540, 130) + text(644, 606, "index.html memuat JavaScript", { size: 22, weight: 800 });
  b += text(644, 642, "Vue Router membaca /resep/52772", S({ size: 19 })) + text(644, 672, "lalu menampilkan RecipeView", S({ size: 19 }));
  b += box(40, 566, 500, 130, { r: 14 }) + text(64, 604, "Di mana aturannya?", { size: 21, weight: 800 });
  b += text(64, 640, "Netlify: [[redirects]] di netlify.toml", S({ size: 18 })) + text(64, 670, "Vercel: rewrites di vercel.json", S({ size: 18 }));
  b += note(746, "npm run preview sudah melakukan fallback ini; hosting harus diberi tahu.");
  return frame("SPA fallback: berkas yang ada dilayani langsung, alamat lain ditulis ulang ke index.html dengan status 200 lalu Vue Router memilih halaman", 780, b, AH);
}

const DIAGRAMS = { "alur-pencarian": alurPencarian, "bahan-dari-api": bahanDariApi, "spa-fallback": spaFallback };
mkdirSync(OUT, { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`${OUT}/${name}.svg`, draw());
  console.log(name);
}
