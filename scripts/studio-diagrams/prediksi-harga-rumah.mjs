// Diagrams for Studio Proyek "prediksi-harga-rumah", embedded as ![ket](/studio/prediksi-harga-rumah/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/prediksi-harga-rumah.mjs
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
const PINK = "#f4b6c2";
const mono = (x, y, s, o = {}) => text(x, y, s, { size: 19, weight: 600, mono: true, ...o });
// Charts (*.webp) are not drawn here: they are the real output of eda.py and
// latih.py from the verified run, converted to webp. swagger-docs.webp is a
// screenshot of the verified API's /docs page.

const two = (x, y, w, h, a, b, o = {}) =>
  box(x, y, w, h, o) + text(x + w / 2, y + h / 2 - 4, a, { size: 22, weight: 800, anchor: "middle" }) +
  text(x + w / 2, y + h / 2 + 26, b, S({ size: 19, anchor: "middle" }));

// Experiment flow: domain rule, split, test set locked, CV on train only, evaluate once.
function alurEksperimen() {
  let b = text(600, 58, "Alur eksperimen: data uji dikunci sampai akhir", { size: 38, weight: 800, anchor: "middle" });
  b += two(380, 96, 440, 84, "data/rumah.csv", "420 baris, 73 sel kosong");
  b += arrow(600, 180, 600, 212);
  b += two(300, 216, 600, 84, "Aturan domain: harga < 50 juta dibuang", "4 salah ketik → 416 baris");
  b += line(600, 300, 600, 326) + line(340, 326, 950, 326);
  b += arrow(340, 326, 340, 368) + arrow(950, 326, 950, 368);
  b += text(645, 356, "train_test_split 80/20", { size: 18, weight: 700, mono: true, anchor: "middle" });
  // left: train
  b += two(60, 372, 560, 76, "Data latih: 332 rumah", "semua keputusan diambil di sini", { fill: M1 });
  b += arrow(340, 448, 340, 474);
  b += two(60, 478, 560, 84, "5-fold cross-validation", "baseline · linear · random forest · HGB");
  b += arrow(340, 562, 340, 588);
  b += two(60, 592, 560, 84, "Pilih: regresi linear, target log", "MAE CV Rp296 jt (baseline Rp966 jt)", { fill: M3 });
  b += arrow(340, 676, 340, 702);
  b += two(60, 706, 560, 70, "fit ulang di 332 rumah latih", "Pipeline: praproses + model");
  // right: test, locked
  b += box(760, 372, 380, 404, { fill: PINK, dash: "12 8" });
  b += text(950, 418, "Data uji: 84 rumah", { size: 24, weight: 800, anchor: "middle" });
  b += `<rect x="922" y="470" width="56" height="44" rx="8" fill="${INK}"/><path d="M932 470 v-14 a18 18 0 0 1 36 0 v14" fill="none" stroke="${INK}" stroke-width="7"/>`;
  b += text(950, 562, "DIKUNCI", { size: 26, weight: 800, anchor: "middle" });
  ["tidak dipakai untuk memilih", "model, praproses, atau", "parameter apa pun"].forEach((s, i) => (b += text(950, 610 + i * 32, s, S({ size: 20, anchor: "middle" }))));
  // evaluate once
  b += arrow(340, 776, 340, 812) + arrow(950, 776, 950, 812);
  b += two(200, 816, 800, 88, "Evaluasi SEKALI di data uji", "MAE Rp325 jt · R² 0,84 · 80% rumah meleset ≤ 20%", { fill: M3 });
  b += arrow(390, 904, 390, 940);
  b += two(200, 944, 380, 84, "joblib.dump", "model/model.joblib + info.json");
  b += arrow(580, 986, 616, 986);
  b += two(620, 944, 380, 84, "FastAPI", "POST /prediksi");
  b += note(1076, "Angka uji mirip angka CV (325 vs 296 juta): tanda tidak ada kebocoran.");
  return frame("Alur eksperimen: aturan domain, split 80/20, data uji dikunci, cross-validation di data latih untuk memilih model, evaluasi sekali di data uji, simpan dengan joblib, sajikan lewat FastAPI", 1110, b, AH);
}

// ColumnTransformer lanes and the log-target regressor.
function pipelinePraproses() {
  let b = text(600, 58, "Pipeline: praproses + model dalam satu objek", { size: 38, weight: 800, anchor: "middle" });
  const lanes = [
    { y: 100, cols: ["luas_tanah", "luas_bangunan"], steps: ["isi median", "log", "skala"], n: "2 kolom", f: M1 },
    { y: 240, cols: ["kamar_tidur, kamar_mandi", "jarak_pusat_km", "tahun_dibangun"], steps: ["isi median", "skala"], n: "4 kolom", f: M1 },
    { y: 380, cols: ["kota"], steps: ["one-hot"], n: "8 kolom", f: M3 },
  ];
  const h = 110;
  for (const L of lanes) {
    b += box(40, L.y, 330, h, { fill: "#ffffff" });
    L.cols.forEach((c, i) => (b += mono(60, L.y + h / 2 + 7 + (i - (L.cols.length - 1) / 2) * 28, c, { size: 19 })));
    const w = 150, gap = 36, total = L.steps.length * w + (L.steps.length - 1) * gap, x0 = 410 + (500 - total) / 2;
    b += arrow(370, L.y + h / 2, x0 - 4, L.y + h / 2);
    L.steps.forEach((s, i) => {
      const x = x0 + i * (w + gap);
      b += box(x, L.y + 20, w, h - 40, { fill: L.f }) + text(x + w / 2, L.y + h / 2 + 8, s, { size: 21, weight: 800, anchor: "middle" });
      if (i) b += arrow(x - gap, L.y + h / 2, x - 4, L.y + h / 2);
    });
    b += arrow(x0 + total, L.y + h / 2, 946, L.y + h / 2);
    b += box(950, L.y + 20, 210, h - 40, { r: 30 }) + text(1055, L.y + h / 2 + 8, L.n, { size: 22, weight: 800, anchor: "middle" });
  }
  b += text(1055, 92, "ColumnTransformer", { size: 18, weight: 700, anchor: "middle", mono: true });
  // bus: every lane's output joins on the right, then feeds one table
  for (const L of lanes) b += line(1160, L.y + h / 2, 1180, L.y + h / 2);
  b += line(1180, lanes[0].y + h / 2, 1180, 520) + line(1180, 520, 600, 520) + arrow(600, 520, 600, 556);
  b += two(250, 560, 700, 80, "2 + 4 + 8 = 14 kolom angka", "satu tabel siap untuk model", { fill: M1 });
  b += arrow(600, 640, 600, 676);
  b += box(40, 680, 1120, 150, { dash: "10 8", sw: 3 });
  b += text(64, 714, "TransformedTargetRegressor", { size: 19, weight: 700, mono: true });
  const inner = [["harga → log1p", "dilatih di skala log"], ["LinearRegression", "koefisien per kolom"], ["expm1 → rupiah", "hasil kembali ke rupiah"]];
  inner.forEach(([a, c], i) => {
    const x = 80 + i * 360;
    b += two(x, 730, 320, 84, a, c, { fill: i === 1 ? M3 : "#ffffff" });
    if (i) b += arrow(x - 40, 772, x - 4, 772);
  });
  b += note(878, "fit() hanya di data latih: median, rata-rata dan simpangan skala, daftar kota,");
  b += note(912, "dan koefisien model semuanya dipelajari dari 332 rumah latih, lalu dipakai apa adanya.");
  return frame("Pipeline praproses: luas diisi median, diambil log, dan diskala; angka lain diisi median dan diskala; kota di-one-hot; total 14 kolom masuk ke regresi linear dengan target log", 950, b, AH);
}

const DIAGRAMS = { "alur-eksperimen": alurEksperimen, "pipeline-praproses": pipelinePraproses };
mkdirSync("public/studio/prediksi-harga-rumah", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/prediksi-harga-rumah/${name}.svg`, draw());
  console.log(name);
}
