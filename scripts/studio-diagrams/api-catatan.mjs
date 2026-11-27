// Diagrams for Studio Proyek "api-catatan", same look as scripts/praktik.mjs.
//   node scripts/studio-diagrams/api-catatan.mjs
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
const line = (x1, y1, x2, y2, { sw = 4, dash } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${sw}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
const AH = '<marker id="ah" markerWidth="14" markerHeight="14" refX="11" refY="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L14 7L0 14z" fill="#0f100d"/></marker>';
const arrow = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="5" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""} marker-end="url(#ah)"/>`;
const S = (o = {}) => ({ size: 22, weight: 500, ...o });
const note = (y, s, w = 500) => text(600, y, s, { size: 24, anchor: "middle", weight: w });
// A box with a bold title and smaller lines under it, centered on x.
const node = (x, y, w, h, title, lines = [], fill = "#ffffff", mono = false) =>
  box(x - w / 2, y, w, h, { fill, r: 16 }) + text(x, y + 40, title, { size: 26, weight: 800, anchor: "middle" }) +
  lines.map((l, i) => text(x, y + 76 + i * 30, l, S({ anchor: "middle", mono }))).join("");

function endpointTabel() {
  let b = text(600, 62, "Kontrak API Catatan: endpoint dan tabel", { size: 40, weight: 800, anchor: "middle" });
  b += text(60, 120, "Metode", S({ weight: 800 })) + text(210, 120, "Path", S({ weight: 800 })) + text(640, 120, "Sukses", S({ weight: 800 })) + text(900, 120, "Error yang mungkin", S({ weight: 800 }));
  const rows = [
    ["GET", "/health", "200", "500"],
    ["GET", "/api/notes?q=&limit=", "200 (array)", "500"],
    ["GET", "/api/notes/:id", "200", "400, 404"],
    ["POST", "/api/notes", "201 + Location", "400, 413, 422"],
    ["PATCH", "/api/notes/:id", "200", "400, 404, 413, 422"],
    ["DELETE", "/api/notes/:id", "204 tanpa body", "400, 404"],
  ];
  rows.forEach(([m, p, ok, err], i) => {
    const y = 140 + i * 66;
    b += box(40, y, 1120, 56, { r: 12, sw: 3 });
    b += box(52, y + 10, 130, 36, { fill: m === "GET" ? M1 : M3, r: 10, sw: 3 }) + text(117, y + 36, m, { size: 20, weight: 800, anchor: "middle", mono: true });
    b += text(210, y + 37, p, { size: 23, weight: 600, mono: true }) + text(640, y + 37, ok, S({ size: 23, weight: 700 })) + text(900, y + 37, err, S({ size: 23 }));
  });
  b += note(580, "Kata kerja ada di metode HTTP, path cukup kata benda jamak. Bentuk error selalu sama:");
  b += text(600, 616, '{ "error": "...", "details": { ... } }', { size: 23, weight: 600, anchor: "middle", mono: true });
  // Table notes
  b += box(40, 650, 1120, 330, { fill: M1, r: 18 });
  b += text(70, 694, "Tabel notes", { size: 28, weight: 800 }) + text(1130, 694, "aturan penting juga dijaga database", S({ anchor: "end" }));
  const cols = [
    ["id", "INTEGER", "GENERATED ALWAYS AS IDENTITY, PRIMARY KEY"],
    ["title", "TEXT", "NOT NULL, CHECK panjang 1 sampai 120"],
    ["content", "TEXT", "NOT NULL DEFAULT ''"],
    ["pinned", "BOOLEAN", "NOT NULL DEFAULT false"],
    ["created_at", "TIMESTAMPTZ", "NOT NULL DEFAULT now()"],
    ["updated_at", "TIMESTAMPTZ", "NOT NULL DEFAULT now(), diisi ulang saat UPDATE"],
  ];
  cols.forEach(([n, t, c], i) => {
    const y = 740 + i * 40;
    b += text(70, y, n, { size: 22, weight: 800, mono: true }) + text(260, y, t, { size: 22, weight: 500, mono: true }) + text(470, y, c, S());
  });
  return frame("Kontrak API Catatan: enam endpoint dengan kode status sukses dan error, serta kolom tabel notes beserta aturannya", 1010, b);
}

function appServerTes() {
  let b = text(600, 62, "Kenapa app.js dan server.js dipisah", { size: 40, weight: 800, anchor: "middle" });
  b += node(600, 330, 380, 150, "src/app.js", ["menyusun rute dan middleware", "export const app"], M3);
  b += node(260, 110, 380, 130, "src/server.js", ["app.listen(PORT)"], "#ffffff", true);
  b += node(940, 110, 380, 130, "test/notes.test.js", ["request(app).get(...)"], "#ffffff", true);
  b += node(600, 580, 380, 120, "src/db.js", ["pool ke PostgreSQL"], M1);
  b += arrow(380, 240, 500, 326) + text(340, 300, "import { app }", S({ anchor: "middle", mono: true }));
  b += arrow(820, 240, 700, 326) + text(860, 300, "import { app }", S({ anchor: "middle", mono: true }));
  b += arrow(600, 480, 600, 572) + text(620, 532, "query", S());
  b += box(60, 600, 340, 100, { r: 16, sw: 3 }) + text(230, 640, "Browser, curl,", S({ anchor: "middle", weight: 700 })) + text(230, 672, "Thunder Client", S({ anchor: "middle", weight: 700 }));
  b += arrow(230, 594, 230, 248, { dash: "10 8" }) + text(244, 440, "port 3000", S());
  b += box(800, 600, 340, 100, { r: 16, sw: 3 }) + text(970, 640, "supertest memanggil app", S({ anchor: "middle", weight: 700 })) + text(970, 672, "langsung, tanpa port", S({ anchor: "middle", weight: 700 }));
  b += arrow(970, 594, 970, 248, { dash: "10 8" });
  b += note(760, "Hanya server.js yang membuka port. Tes mengimpor app tanpa menyalakan server sungguhan.");
  return frame("app.js menyusun aplikasi dan diimpor oleh server.js yang membuka port, serta oleh tes supertest yang memanggil app tanpa port", 800, b, AH);
}

function deploy() {
  let b = text(600, 62, "API Catatan di internet: Render dan Neon", { size: 40, weight: 800, anchor: "middle" });
  b += node(170, 130, 260, 120, "GitHub", ["repo api-catatan"]);
  b += node(170, 360, 260, 150, "Pemakai API", ["curl, browser,", "aplikasi lain"]);
  b += box(420, 120, 360, 400, { fill: M3, r: 20 }) + text(600, 166, "Render Web Service", { size: 28, weight: 800, anchor: "middle" });
  [["Build", "npm install"], ["Start", "npm start"], ["PORT", "diisi Render"], ["Health check", "/health"], ["Env", "DATABASE_URL"]].forEach(([k, v], i) => {
    b += text(450, 222 + i * 58, k, S({ weight: 800 })) + text(610, 222 + i * 58, v, { size: 22, weight: 500, mono: true });
  });
  b += box(880, 120, 280, 400, { fill: M1, r: 20 }) + text(1020, 166, "Neon Postgres", { size: 28, weight: 800, anchor: "middle" });
  ["tabel notes", "dibuat lewat", "SQL Editor", "(isi schema.sql)", "", "region dekat", "Render, misal", "Singapore"].forEach((l, i) => { if (l) b += text(1020, 222 + i * 34, l, S({ anchor: "middle" })); });
  b += arrow(304, 160, 412, 200) + text(330, 150, "push", S({ weight: 700 }));
  b += arrow(304, 420, 412, 420) + text(358, 404, "HTTPS", S({ anchor: "middle", weight: 700 }));
  b += arrow(786, 320, 872, 320) + text(830, 300, "SSL", S({ anchor: "middle", weight: 700 }));
  b += box(40, 570, 1120, 150, { r: 16, sw: 3 });
  b += text(70, 612, "Connection string Neon", S({ weight: 800 }));
  b += text(70, 650, "postgresql://USER:SANDI@HOST.neon.tech/DB?sslmode=require&channel_binding=require", { size: 19, weight: 500, mono: true });
  b += text(70, 694, "Disimpan di Environment Render, tidak pernah di repo. sslmode wajib ada.", S());
  b += note(770, "Paket gratis Render tidur saat sepi: request pertama setelahnya butuh sekitar satu menit.");
  return frame("Alur deploy: kode di-push ke GitHub, Render membangun dan menjalankan API, pemakai memanggil lewat HTTPS, dan API terhubung ke Neon Postgres dengan SSL", 810, b, AH);
}

const DIAGRAMS = { "endpoint-dan-tabel": endpointTabel, "app-server-tes": appServerTes, "deploy-render-neon": deploy };
mkdirSync("public/studio/api-catatan", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/api-catatan/${name}.svg`, draw());
  console.log(name);
}
