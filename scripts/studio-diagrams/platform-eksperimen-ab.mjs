// Diagrams for Studio Proyek "platform-eksperimen-ab", embedded as ![ket](/studio/platform-eksperimen-ab/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/platform-eksperimen-ab.mjs
// hasil-ci and peeking bars use the numbers from the verified run in .cache/verify-platform-eksperimen-ab
// (npm run analyze -- tombol-hijau, npm run peeking).
import { mkdirSync, writeFileSync } from "node:fs";

const INK = "#0f100d", M1 = "#e3edc8", M3 = "#b5d36f", PINK = "#f4b6c2", GREY = "#6b6f66";
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
const AH = '<marker id="ah" markerWidth="14" markerHeight="14" refX="11" refY="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L14 7L0 14z" fill="#0f100d"/></marker>';
const arrow = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${o.sw ?? 5}" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""} marker-end="url(#ah)"/>`;
const line = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? INK}" stroke-width="${o.sw ?? 3}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}/>`;
const S = (o = {}) => ({ size: 20, weight: 500, ...o });
const mono = (x, y, s, o = {}) => text(x, y, s, { size: 18, weight: 600, mono: true, ...o });

// Architecture: SDK in the app, API, Postgres, analysis.
function arsitektur() {
  let b = text(600, 56, "Platform eksperimen dari ujung ke ujung", { size: 36, weight: 800, anchor: "middle" });
  // App + SDK
  b += box(40, 110, 340, 250, { fill: M1 });
  b += text(210, 150, "Layanan produk", { size: 24, weight: 800, anchor: "middle" });
  b += box(66, 172, 288, 166, { fill: "#ffffff", sw: 3 });
  b += text(210, 204, "SDK (di memori)", { size: 20, weight: 800, anchor: "middle" });
  b += mono(84, 236, "variant(flag, user)", { size: 17 });
  b += text(84, 262, "sinkron, tanpa jaringan", S({ size: 16 }));
  b += mono(84, 292, "track(metrik, user, nilai)", { size: 17 });
  b += text(84, 318, "antre → batch, id pseudonim", S({ size: 16 }));
  // API
  b += box(470, 110, 300, 250, { fill: M3 });
  b += text(620, 150, "API eksperimen", { size: 24, weight: 800, anchor: "middle" });
  b += mono(492, 192, "GET  /sdk/flags", { size: 17 });
  b += mono(492, 222, "GET  /sdk/stream", { size: 17 });
  b += mono(492, 252, "POST /events", { size: 17 });
  b += mono(492, 282, "PUT  /admin/flags/:key", { size: 17 });
  b += mono(492, 312, "POST .../kill", { size: 17 });
  b += mono(492, 342, "GET  .../results", { size: 17 });
  // Admin
  b += box(860, 130, 300, 110);
  b += text(1010, 174, "PM / on-call", { size: 22, weight: 800, anchor: "middle" });
  b += text(1010, 206, "token admin = actor di audit", S({ size: 17, anchor: "middle" }));
  b += arrow(856, 190, 778, 220);
  b += box(860, 270, 300, 90, { dash: "10 8", sw: 3 });
  b += text(1010, 308, "Laporan: SRM, CI,", S({ size: 18, anchor: "middle", weight: 600 }));
  b += text(1010, 334, "CUPED, guardrail", S({ size: 18, anchor: "middle", weight: 600 }));
  b += arrow(778, 330, 852, 318);
  // SDK <-> API arrows
  b += arrow(462, 170, 384, 170);
  b += mono(423, 158, "SSE", { anchor: "middle", size: 15 });
  b += arrow(462, 228, 384, 228);
  b += mono(423, 216, "flags", { anchor: "middle", size: 15 });
  b += arrow(384, 300, 462, 300);
  b += mono(423, 288, "batch", { anchor: "middle", size: 15 });
  // Postgres
  b += box(40, 440, 1120, 250, { fill: "#ffffff" });
  b += text(600, 480, "PostgreSQL", { size: 26, weight: 800, anchor: "middle" });
  b += box(70, 500, 300, 160, { fill: M1, sw: 3 });
  b += mono(220, 534, "flags", { anchor: "middle", size: 20 });
  b += text(220, 566, "salt, traffic_bp, varian,", S({ size: 17, anchor: "middle" }));
  b += text(220, 592, "killed, version", S({ size: 17, anchor: "middle" }));
  b += text(220, 630, "NOTIFY saat COMMIT", { size: 17, weight: 700, anchor: "middle" });
  b += box(400, 500, 300, 160, { fill: "#ffffff", sw: 3 });
  b += mono(550, 534, "audit_log", { anchor: "middle", size: 20 });
  b += text(550, 566, "siapa, apa, kenapa,", S({ size: 17, anchor: "middle" }));
  b += text(550, 592, "before / after", S({ size: 17, anchor: "middle" }));
  b += text(550, 630, "trigger: hanya INSERT", { size: 17, weight: 700, anchor: "middle" });
  b += box(730, 500, 400, 160, { fill: M3, sw: 3 });
  b += mono(930, 534, "events (partisi per bulan)", { anchor: "middle", size: 19 });
  ["2026_10", "2026_11", "2026_12", "DEFAULT"].forEach((p, i) => {
    b += box(748 + i * 95, 552, 86, 44, { fill: i === 3 ? "#ffffff" : M1, r: 8, sw: 2, dash: i === 3 ? "6 5" : undefined });
    b += mono(791 + i * 95, 580, p, { anchor: "middle", size: 13 });
  });
  b += text(930, 630, "PK (event_id, ts) → duplikat dibuang", { size: 17, weight: 700, anchor: "middle" });
  // API <-> DB
  b += arrow(520, 366, 246, 490);
  b += mono(350, 414, "simpan + audit + NOTIFY", { anchor: "end", size: 15 });
  b += arrow(300, 492, 574, 368, { dash: "10 8", sw: 4 });
  b += mono(500, 414, "LISTEN", { size: 15 });
  b += arrow(640, 364, 900, 494);
  b += mono(860, 418, "INSERT … ON CONFLICT", { anchor: "middle", size: 15 });
  b += text(600, 722, "Analisis: Postgres menjumlah n, Σy, Σy², Σx, Σx², Σxy per varian; Node menghitung uji dari angka itu.", S({ anchor: "middle", size: 18, weight: 600 }));
  return frame("Arsitektur platform eksperimen: SDK di layanan produk mengevaluasi flag di memori, menerima perubahan lewat SSE dan mengirim event per batch. API menyimpan flag bersama audit log dan NOTIFY dalam satu transaksi, menyimpan event ke tabel berpartisi bulanan dengan kunci event_id dan ts, dan membuat laporan dari jumlah-jumlah per varian.", 750, b, AH);
}

// Two hashes: traffic and variant. Raising traffic keeps units; changing weights moves them.
function hashBucket() {
  let b = text(600, 56, "Dua hash: ikut atau tidak, lalu varian yang mana", { size: 34, weight: 800, anchor: "middle" });
  const X = 160, W = 960, bar = (y, segs, label, sub) => {
    let s = text(X - 20, y + 32, label, { size: 20, weight: 800, anchor: "end" });
    if (sub) s += text(X - 20, y + 56, sub, S({ size: 15, anchor: "end", fill: GREY }));
    let x = X;
    for (const [w, fill, t] of segs) {
      const ww = (w / 10000) * W;
      s += box(x, y, ww, 50, { fill, r: 6, sw: 3 });
      if (t) s += text(x + ww / 2, y + 33, t, { size: 18, weight: 700, anchor: "middle" });
      x += ww;
    }
    return s;
  };
  const tick = (y) => [0, 1000, 2000, 5000, 7000, 10000].map((v) => mono(X + (v / 10000) * W, y, String(v), { anchor: "middle", size: 14 })).join("");
  b += mono(600, 100, 'hash 1: bucket(salt + ":traffic", unit)', { anchor: "middle" });
  b += bar(120, [[1000, M3, "10%"], [9000, "#ffffff", "default, tidak dicatat"]], "traffic 10%");
  b += bar(190, [[1000, M3, "lama"], [1000, M1, "baru"], [8000, "#ffffff", "default"]], "traffic 20%", "unit lama tetap");
  b += tick(262);
  b += mono(600, 320, 'hash 2: bucket(salt + ":variant", unit), independen dari hash 1', { anchor: "middle" });
  b += bar(340, [[5000, M1, "control"], [5000, M3, "treatment"]], "bobot 50/50");
  b += bar(410, [[5000, M1, "control"], [2000, PINK, "pindah → control"], [3000, M3, "treatment"]], "bobot 70/30", "≈20% unit pindah");
  b += tick(482);
  b += box(100, 520, 1000, 110, { fill: "#ffffff", dash: "10 8", sw: 3 });
  b += text(600, 560, "Naikkan traffic kapan saja: unit yang sudah ikut tetap di variannya.", { size: 21, weight: 700, anchor: "middle" });
  b += text(600, 596, "Bobot dikunci saat running (409). Mau bobot lain? Buat flag baru dengan salt baru.", S({ size: 19, anchor: "middle" }));
  return frame("Assignment dua hash. Hash traffic memutuskan unit ikut eksperimen: menaikkan traffic dari 10 ke 20 persen hanya menambah unit baru. Hash varian memilih control atau treatment: mengubah bobot 50/50 menjadi 70/30 memindahkan bucket 5000 sampai 6999, sekitar 20 persen unit, dari treatment ke control.", 660, b, AH);
}

// Forest plot of the verified run: true effect vs raw and CUPED 95% CI.
function hasilCi() {
  let b = text(600, 56, "Efek yang ditanam ditemukan kembali", { size: 34, weight: 800, anchor: "middle" });
  b += text(600, 90, "40.000 unit sintetis lewat POST /events, CI 95% dari npm run analyze", S({ size: 18, anchor: "middle", fill: GREY }));
  const panel = (y0, title, truth, rows, lo, hi, fmt, ticks) => {
    const X = 330, W = 780, sx = (v) => X + ((v - lo) / (hi - lo)) * W;
    let s = text(60, y0 + 10, title, { size: 22, weight: 800 });
    s += line(X, y0 + 150, X + W, y0 + 150, { sw: 2 });
    for (const t of ticks) {
      s += line(sx(t), y0 + 150, sx(t), y0 + 158, { sw: 2 });
      s += mono(sx(t), y0 + 180, fmt(t), { anchor: "middle", size: 15 });
    }
    s += line(sx(0), y0 + 30, sx(0), y0 + 150, { stroke: GREY, sw: 2 });
    s += line(sx(truth), y0 + 26, sx(truth), y0 + 150, { sw: 3, dash: "8 6" });
    s += text(sx(truth) + 8, y0 + 40, `efek benar ${fmt(truth)}`, { size: 16, weight: 700 });
    rows.forEach(([name, est, a, c, fill], i) => {
      const y = y0 + 75 + i * 50;
      s += text(X - 20, y + 6, name, S({ anchor: "end", size: 18, weight: 700 }));
      s += `<rect x="${sx(a)}" y="${y - 9}" width="${sx(c) - sx(a)}" height="18" rx="9" fill="${fill}" stroke="${INK}" stroke-width="2.5"/>`;
      s += `<circle cx="${sx(est)}" cy="${y}" r="8" fill="${INK}"/>`;
      s += mono(sx(c) + 12, y + 6, `[${fmt(a)}, ${fmt(c)}]`, { size: 14 });
    });
    return s;
  };
  const pct = (v) => (v === 0 ? "0" : `${v > 0 ? "+" : ""}${(v * 100).toFixed(1).replace(".", ",")} pp`);
  const rp = (v) => `${v >= 0 ? "+" : ""}${Math.round(v).toLocaleString("id-ID")}`;
  b += panel(130, "Konversi checkout", 0.0249, [["mentah (uji z)", 0.0240, 0.0143, 0.0337, M1], ["CUPED (varians −19,6%)", 0.0256, 0.0169, 0.0343, M3]], -0.005, 0.045, pct, [0, 0.01, 0.02, 0.03, 0.04]);
  b += panel(360, "Pendapatan per unit (Rp)", 4000, [["mentah (Welch)", 3430, 1534, 5325, M1], ["CUPED (varians −27,6%)", 3620, 2007, 5233, M3]], -1000, 7000, rp, [0, 2000, 4000, 6000]);
  b += text(600, 600, "Kedua CI memuat efek benar; CI CUPED lebih sempit karena riwayat belanja menjelaskan sebagian varians.", S({ size: 18, anchor: "middle", weight: 600 }));
  return frame("Hasil verifikasi nyata. Konversi: efek benar +2,5 poin persen, CI mentah +1,4 sampai +3,4, CI CUPED +1,7 sampai +3,4. Pendapatan per unit: efek benar 4.000, CI mentah 1.534 sampai 5.325, CI CUPED 2.007 sampai 5.233. Kedua CI memuat efek benar dan CUPED lebih sempit.", 630, b);
}

// Peeking: one A/A p-value path + false positive bars from the verified run.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function normalCdf(z) { // Abramowitz-Stegun 7.1.26, cukup untuk gambar
  const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}
function aaPath(seed) {
  const rand = mulberry32(seed); let x1 = 0, x2 = 0, n = 0; const ps = [];
  for (let k = 0; k < 10; k++) {
    for (let i = 0; i < 1000; i++) { if (rand() < 0.1) x1++; if (rand() < 0.1) x2++; }
    n += 1000; const pp = (x1 + x2) / (2 * n), z = (x2 - x1) / n / Math.sqrt(pp * (1 - pp) * 2 / n);
    ps.push(2 * (1 - normalCdf(Math.abs(z))));
  }
  return ps;
}
function peeking() {
  let b = text(600, 56, "Mengintip setiap hari membuat kebetulan terlihat seperti efek", { size: 32, weight: 800, anchor: "middle" });
  // pick the first seed whose path dips under 0.05 early and ends above 0.05
  let seed = 1, ps;
  for (; seed < 5000; seed++) { ps = aaPath(seed); const k = ps.findIndex((p) => p < 0.05); if (k >= 1 && k <= 4 && ps[9] > 0.3) break; }
  const X = 110, Y = 130, W = 470, H = 330, sy = (p) => Y + H - (p * H), sx = (k) => X + (k / 9) * W;
  b += text(X, Y - 24, "Satu eksperimen A/A (tanpa efek)", { size: 20, weight: 800 });
  b += line(X, Y, X, Y + H, { sw: 2 }) + line(X, Y + H, X + W, Y + H, { sw: 2 });
  for (const v of [0, 0.25, 0.5, 0.75, 1]) b += mono(X - 10, sy(v) + 5, v.toFixed(2).replace(".", ","), { anchor: "end", size: 14 });
  b += `<rect x="${X}" y="${sy(0.05)}" width="${W}" height="${sy(0) - sy(0.05)}" fill="${PINK}" opacity="0.6"/>`;
  b += line(X, sy(0.05), X + W, sy(0.05), { dash: "8 6", sw: 2 });
  b += mono(X + W - 4, sy(0.05) - 8, "p = 0,05", { anchor: "end", size: 14 });
  b += `<polyline points="${ps.map((p, k) => `${sx(k)},${sy(p)}`).join(" ")}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  ps.forEach((p, k) => { b += `<circle cx="${sx(k)}" cy="${sy(p)}" r="${p < 0.05 ? 9 : 6}" fill="${p < 0.05 ? INK : "#ffffff"}" stroke="${INK}" stroke-width="3"/>`; });
  for (let k = 0; k < 10; k++) b += mono(sx(k), Y + H + 24, String(k + 1), { anchor: "middle", size: 14 });
  b += text(X + W / 2, Y + H + 52, "intipan ke- (tiap 1.000 unit per varian)", S({ size: 16, anchor: "middle" }));
  const hit = ps.findIndex((p) => p < 0.05);
  b += text(sx(hit) + 16, sy(ps[hit]) - 20, `“signifikan!” di intipan ${hit + 1}`, { size: 17, weight: 700 });
  b += text(X + W / 2, Y + H + 84, `Kalau dibaca di akhir saja: p = ${ps[9].toFixed(2).replace(".", ",")}, tidak ada efek.`, S({ size: 16, anchor: "middle" }));
  // bars (verified numbers, 2000 A/A experiments)
  const bars = [["sekali di akhir", 0.049, M3], ["intip, stop saat p<0,05", 0.200, PINK], ["intip, batas Pocock", 0.047, M3]];
  const BX = 700, BW = 120, BY = Y + H, scale = H / 0.25;
  b += text(BX - 20, Y - 24, "Positif palsu dari 2.000 eksperimen A/A", { size: 20, weight: 800 });
  b += line(BX - 20, sy(0) , BX + 3 * (BW + 30), sy(0), { sw: 2 });
  b += line(BX - 20, BY - 0.05 * scale, BX + 3 * (BW + 30), BY - 0.05 * scale, { dash: "8 6", sw: 2 });
  b += mono(BX - 26, BY - 0.05 * scale + 5, "5%", { anchor: "end", size: 14 });
  bars.forEach(([name, v, fill], i) => {
    const x = BX + i * (BW + 30), h = v * scale;
    b += box(x, BY - h, BW, h, { fill, r: 6, sw: 3 });
    b += text(x + BW / 2, BY - h - 12, `${(v * 100).toFixed(1).replace(".", ",")}%`, { size: 22, weight: 800, anchor: "middle" });
    name.split(", ").forEach((part, j) => { b += text(x + BW / 2, BY + 26 + j * 22, part, S({ size: 15, anchor: "middle" })); });
  });
  return frame(`Kiri: p-value satu eksperimen A/A tanpa efek, dicek sepuluh kali; sempat di bawah 0,05 di intipan ${hit + 1} lalu naik lagi. Kanan: dari 2.000 eksperimen A/A, membaca sekali di akhir memberi 4,9 persen positif palsu, berhenti saat p kurang dari 0,05 di salah satu dari 10 intipan memberi 20 persen, dan batas Pocock memberi 4,7 persen.`, 600, b);
}

const DIAGRAMS = { arsitektur, "hash-bucket": hashBucket, "hasil-ci": hasilCi, peeking };
mkdirSync("public/studio/platform-eksperimen-ab", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/platform-eksperimen-ab/${name}.svg`, draw());
  console.log(name);
}
