// Diagrams for Studio Proyek "paket-npm-typescript", embedded as ![ket](/studio/paket-npm-typescript/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/paket-npm-typescript.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const INK = "#0f100d", M1 = "#e3edc8", M3 = "#b5d36f";
const esc = (s) => String(s).replace(/^ +/, (m) => "\u00a0".repeat(m.length)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
const note = (y, s, w = 500) => text(600, y, s, { size: 22, anchor: "middle", weight: w });


// Three imports, followed through the "exports" map to a file in dist/ (or to an error).
function resolusiExports() {
  let b = text(600, 58, "Satu nama paket, berkas yang dipilih tergantung siapa yang bertanya", { size: 32, weight: 800, anchor: "middle" });
  const kolom = [["Pemakai menulis", 175], ["Kunci exports", 520], ["Kondisi", 760], ["Berkas di dist/", 1015]];
  kolom.forEach(([t, x]) => (b += text(x, 112, t, { size: 21, weight: 800, anchor: "middle" })));
  const baris = [
    { y: 140, kode: ['import { terbilang }', 'from "@namamu/idn-kit"'], ket: "ESM (Node, Vite)", kunci: '"."', kond: "import", tipe: "index.d.ts", js: "index.js", fill: M1 },
    { y: 330, kode: ['require(', '"@namamu/idn-kit/nik")'], ket: "CommonJS", kunci: '"./nik"', kond: "require", tipe: "nik.d.cts", js: "nik.cjs", fill: "#ffffff" },
  ];
  for (const r of baris) {
    b += box(30, r.y, 290, 150, { fill: r.fill, r: 16 });
    b += text(48, r.y + 40, r.kode[0], { size: 18, weight: 600, mono: true });
    b += text(48, r.y + 70, r.kode[1], { size: 18, weight: 600, mono: true });
    b += text(48, r.y + 118, r.ket, S({ size: 20, weight: 700 }));
    b += box(420, r.y + 40, 200, 70, { r: 12 }) + text(520, r.y + 84, r.kunci, { size: 22, weight: 800, anchor: "middle", mono: true });
    b += box(680, r.y + 40, 160, 70, { r: 12, fill: M3 }) + text(760, r.y + 84, r.kond, { size: 22, weight: 800, anchor: "middle", mono: true });
    b += box(890, r.y, 280, 150, { r: 16 });
    b += text(910, r.y + 44, "types", S({ size: 17, weight: 700 })) + text(990, r.y + 44, r.tipe, { size: 19, weight: 700, mono: true });
    b += text(910, r.y + 78, "dibaca TypeScript", S({ size: 16 }));
    b += text(910, r.y + 116, "default", S({ size: 17, weight: 700 })) + text(990, r.y + 116, r.js, { size: 19, weight: 700, mono: true });
    b += text(910, r.y + 140, "dijalankan Node", S({ size: 16 }));
    b += arrow(324, r.y + 75, 412, r.y + 75) + arrow(622, r.y + 75, 672, r.y + 75) + arrow(842, r.y + 75, 882, r.y + 75);
  }
  // Blocked deep import
  const y = 520;
  b += box(30, y, 290, 120, { r: 16, dash: "10 8" });
  b += text(48, y + 40, 'require("@namamu/idn-kit', { size: 17, weight: 600, mono: true });
  b += text(48, y + 70, '/dist/nik.cjs")', { size: 17, weight: 600, mono: true });
  b += text(48, y + 102, "jalan pintas ke dalam", S({ size: 19, weight: 700 }));
  b += box(420, y + 25, 750, 70, { r: 12, dash: "10 8" });
  b += text(440, y + 58, "tidak ada kunci \"./dist/nik.cjs\" di exports", { size: 20, weight: 700 });
  b += text(440, y + 84, "Node: ERR_PACKAGE_PATH_NOT_EXPORTED", { size: 18, weight: 700, mono: true, fill: "#b42318" });
  b += arrow(324, y + 60, 412, y + 60);
  b += note(694, "exports adalah daftar pintu resmi: yang tidak tertulis tidak bisa diimpor,");
  b += note(726, "jadi isi dist/ boleh kamu ubah tanpa merusak pemakai.");
  b += note(770, "\"types\" ditulis paling atas di tiap cabang. Node tidak mengenal kondisi itu,");
  b += note(802, "jadi ia melewatinya dan memakai \"default\".");
  return frame("Resolusi exports map: import ESM ke kunci titik kondisi import ke index.js dan index.d.ts, require CJS ke kunci nik kondisi require ke nik.cjs dan nik.d.cts, impor dalam ke dist ditolak", 840, b, AH);
}

// Changesets release flow with per-job permissions.
function alurRilis() {
  let b = text(600, 58, "Dari changeset sampai terbit di npm", { size: 38, weight: 800, anchor: "middle" });
  const atas = [
    ["1. Ngoding", ["fitur + tes", "npx changeset"], "#ffffff"],
    ["2. Pull request", ["CI matriks Node", "22, 24, 26"], "#ffffff"],
    ["3. Merge ke main", ["release.yml", "berjalan"], "#ffffff"],
    ["4. select-mode", ["ada changeset?", "versi sudah terbit?"], M3],
  ];
  atas.forEach(([j, ls, fill], i) => {
    const x = 30 + i * 295;
    b += box(x, 100, 255, 130, { fill, r: 16 });
    b += text(x + 128, 140, j, { size: 23, weight: 800, anchor: "middle" });
    ls.forEach((l, k) => (b += text(x + 128, 178 + k * 30, l, S({ anchor: "middle", size: 19 }))));
    if (i < 3) b += arrow(x + 258, 165, x + 287, 165);
  });
  // version branch (middle column)
  b += `<polyline points="935,232 935,290 748,290 748,322" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round" marker-end="url(#ah)"/>`;
  b += text(842, 280, "ada changeset", S({ anchor: "middle", size: 18, weight: 800 }));
  b += box(620, 330, 255, 230, { fill: M1, r: 16 });
  b += text(748, 368, "5a. version", { size: 23, weight: 800, anchor: "middle" });
  ["membuka PR", "\"Version Packages\":", "versi naik,", "CHANGELOG ditulis,", "changeset dihapus.", "Merge PR ini: ke 3 lagi"].forEach(
    (l, k) => (b += text(748, 404 + k * 28, l, S({ anchor: "middle", size: 18, weight: k === 5 ? 800 : 500 }))));
  // publish branch (right column)
  b += arrow(1150, 232, 1150, 322);
  b += text(1140, 262, "tidak ada changeset,", S({ anchor: "end", size: 17, weight: 800 })) + text(1140, 286, "versi belum di npm", S({ anchor: "end", size: 17, weight: 800 }));
  b += box(915, 330, 255, 120, { r: 16 });
  b += text(1042, 368, "5b. pack", { size: 23, weight: 800, anchor: "middle" });
  b += text(1042, 402, "npm test, lalu", S({ anchor: "middle", size: 18 })) + text(1042, 430, "tarball .tgz", S({ anchor: "middle", size: 18 }));
  b += arrow(1042, 452, 1042, 492);
  b += box(915, 500, 255, 150, { fill: M3, r: 16 });
  b += text(1042, 538, "6. publish", { size: 23, weight: 800, anchor: "middle" });
  ["token OIDC dari GitHub,", "tanpa NPM_TOKEN,", "provenance otomatis"].forEach((l, k) => (b += text(1042, 572 + k * 28, l, S({ anchor: "middle", size: 18 }))));
  b += arrow(1042, 652, 1042, 692);
  b += box(915, 700, 255, 120, { r: 16 });
  b += text(1042, 738, "7. Terbit", { size: 23, weight: 800, anchor: "middle" });
  b += text(1042, 772, "npm + tag git", S({ anchor: "middle", size: 18 })) + text(1042, 800, "+ GitHub Release", S({ anchor: "middle", size: 18 }));
  // permissions table (left)
  b += box(30, 330, 545, 490, { r: 18, sw: 3, dash: "10 8" });
  b += text(54, 372, "Izin tiap job (permissions)", { size: 23, weight: 800 });
  const izin = [
    ["select-mode", "contents: read"],
    ["version", "contents: write"],
    ["", "pull-requests: write"],
    ["pack", "contents: read"],
    ["publish", "contents: write"],
    ["", "id-token: write"],
  ];
  izin.forEach(([job, p], k) => {
    const y = 420 + k * 44;
    if (job) b += text(54, y, job, { size: 20, weight: 800, mono: true });
    b += text(250, y, p, { size: 19, weight: p === "id-token: write" ? 800 : 600, mono: true });
  });
  b += line(54, 696, 550, 696, { sw: 2 });
  b += text(54, 734, "Hanya job publish yang boleh meminta", S({ size: 19 }));
  b += text(54, 762, "token OIDC, dan job itu tidak menjalankan", S({ size: 19 }));
  b += text(54, 790, "build ataupun tes. Tarball dibuat oleh pack.", S({ size: 19 }));
  b += note(866, "Semua action dipasang ke SHA commit lengkap, jadi tag yang dipindah orang lain");
  b += note(898, "tidak bisa mengganti kode yang berjalan.");
  return frame("Alur rilis Changesets: ngoding dan changeset, PR dengan CI, merge ke main, select-mode memilih version (PR Version Packages) atau pack lalu publish dengan OIDC ke npm, plus izin tiap job", 930, b, AH);
}

const DIAGRAMS = { "resolusi-exports": resolusiExports, "alur-rilis": alurRilis };
mkdirSync("public/studio/paket-npm-typescript", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/paket-npm-typescript/${name}.svg`, draw());
  console.log(name);
}
