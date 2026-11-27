// Diagrams for Studio Proyek "monitoring-layanan", same look as scripts/praktik.mjs.
//   node scripts/studio-diagrams/monitoring-layanan.mjs
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
const circle = (cx, cy, r, { fill = "#ffffff", sw = 4 } = {}) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;

const M = (o = {}) => ({ size: 18, weight: 500, mono: true, ...o });
const lines = (x, y, arr, o = {}) => arr.map((l, i) => text(x, y + i * 26, l, i === 0 ? S({ size: 19, weight: 800 }) : M(o))).join("");

const PINK = "#f4b6c2";
const label = (x, y, s, o = {}) => text(x, y, s, S({ size: 18, weight: 700, ...o }));
const path = (pts, { sw = 5, stroke = INK, dash } = {}) =>
  `<polyline points="${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;

function tumpukan() {
  let b = text(600, 56, "Tumpukan observabilitas layanan-toko", { size: 34, weight: 800, anchor: "middle" });
  b += text(40, 100, "Metrik", S({ size: 22, weight: 800 })) + text(40, 470, "Log", S({ size: 22, weight: 800 }));
  b += node(170, 110, 270, 156, "layanan-toko", ["Node.js :3000", "GET /metrics", "log JSON ke stdout"], M3);
  b += node(510, 120, 260, 120, "Prometheus", ["scrape tiap 15 dtk", "rules/slo.yml"], M1);
  b += node(840, 120, 240, 120, "Alertmanager", ["group, route,", "inhibit"], M1);
  b += node(1090, 120, 150, 120, "penerima", ["webhook,", "Telegram"]);
  b += arrow(378, 180, 306, 180) + label(342, 166, "tarik", { anchor: "middle" });
  b += arrow(642, 180, 714, 180) + label(678, 166, "alert", { anchor: "middle" });
  b += arrow(962, 180, 1009, 180);
  b += node(510, 320, 300, 100, "Grafana :3001", ["dasbor dari kode"], M3);
  b += arrow(510, 242, 510, 314) + label(524, 286, "PromQL");
  b += node(170, 490, 260, 100, "Docker", ["log kontainer"]);
  b += node(510, 490, 260, 100, "Alloy", ["docker.sock :ro"], M1);
  b += node(840, 490, 240, 100, "Loki", ["label: service, level"], M1);
  b += arrow(170, 268, 170, 484) + label(184, 380, "stdout");
  b += arrow(302, 540, 374, 540) + arrow(642, 540, 714, 540);
  b += arrow(800, 486, 666, 400) + label(752, 440, "LogQL");
  b += note(650, "Prometheus memutuskan apakah alert menyala. Alertmanager memutuskan siapa diberi tahu dan kapan.", 500).replace('font-size="24"', 'font-size="21"');
  b += note(684, "Semua port terikat ke 127.0.0.1; dari luar, lihat lewat terowongan SSH.", 500).replace('font-size="24"', 'font-size="21"');
  return frame("Tumpukan observabilitas: Prometheus menarik metrik dari layanan, mengevaluasi aturan SLO dan mengirim alert ke Alertmanager lalu ke penerima; log stdout dibaca Alloy dari Docker dan dikirim ke Loki; Grafana membaca Prometheus dan Loki", 720, b, AH);
}

// Fault 30% error from minute 30 to 70. Windows are trailing averages.
function burnRate() {
  let b = text(600, 56, "Alert burn rate: dua jendela harus sama-sama di atas batas", { size: 32, weight: 800, anchor: "middle" });
  const X0 = 120, X1 = 1140, Y0 = 560, Y1 = 120, T = 120, R = 0.35;
  const px = (t) => X0 + ((X1 - X0) * t) / T, py = (r) => Y0 - ((Y0 - Y1) * r) / R;
  const raw = (t) => (t >= 30 && t < 70 ? 0.3 : 0.003);
  const avg = (t, w) => { let s = 0, n = 0; for (let u = t - w; u <= t; u += 0.25) { s += raw(u); n++; } return s / n; };
  const series = (w) => Array.from({ length: T * 2 + 1 }, (_, i) => [px(i / 2), py(avg(i / 2, w))]);
  const thr = 14.4 * 0.005;
  // alert window shading
  const on = 46.4, off = 73.8;
  b += `<rect x="${px(on)}" y="${Y1}" width="${px(off) - px(on)}" height="${Y0 - Y1}" fill="${PINK}" opacity="0.6"/>`;
  b += `<rect x="${px(30)}" y="${Y0 + 8}" width="${px(70) - px(30)}" height="14" fill="${INK}"/>` + text(px(50), Y0 + 50, "gangguan: 30% request 5xx", S({ size: 19, weight: 800, anchor: "middle" }));
  // axes and grid
  for (const r of [0, 0.1, 0.2, 0.3]) b += line(X0, py(r), X1, py(r), { sw: 1, dash: r ? "4 8" : undefined }) + text(X0 - 12, py(r) + 7, `${r * 100}%`, S({ size: 18, anchor: "end" }));
  for (const t of [0, 30, 60, 90, 120]) b += text(px(t), Y0 + 82, `${t} mnt`, S({ size: 18, anchor: "middle" }));
  b += line(X0, Y1 - 10, X0, Y0, { sw: 3 });
  b += line(X0, py(thr), X1, py(thr), { sw: 4, dash: "14 8" }) + text(X0 + 12, py(thr) + 30, "batas 14.4 x 0.5% = 7.2%", S({ size: 19, weight: 800 }));
  b += path(series(5), { sw: 4 }) + path(series(60), { sw: 8, stroke: M3 }) + path(series(60), { sw: 2 });
  b += text(px(80), py(0.28), "rasio 1h", S({ size: 20, weight: 800 }));
  b += line(px(79), py(0.27) + 6, px(76), py(avg(76, 60)) - 6, { sw: 2 });
  b += text(px(32), py(0.33), "rasio 5m", S({ size: 20, weight: 800 }));
  b += text((px(on) + px(off)) / 2, Y1 + 28, "alert menyala", S({ size: 19, weight: 800, anchor: "middle" }));
  // legend notes
  b += box(40, 680, 1120, 170, { r: 16, sw: 3 });
  b += text(64, 718, "Menit 31: rasio 5m sudah di atas 7.2%, rasio 1h belum. Lonjakan sesaat tidak membangunkan orang.", S({ size: 19 }));
  b += text(64, 752, "Menit 44: rasio 1h ikut lewat batas. Setelah for: 2m, alert menyala di menit 46.", S({ size: 19 }));
  b += text(64, 786, "Menit 74: gangguan sudah berhenti, rasio 5m turun di bawah batas, alert padam walau rasio 1h masih 20%.", S({ size: 19 }));
  b += text(64, 826, "Jendela panjang membuktikan masalahnya besar. Jendela pendek membuktikan masalahnya masih terjadi.", S({ size: 20, weight: 800 }));
  return frame("Grafik rasio error 5 menit dan 1 jam selama gangguan 30% error dari menit 30 sampai 70: alert menyala di menit 46 ketika keduanya di atas 7,2% dan padam di menit 74 ketika rasio 5 menit turun", 880, b);
}

function histogram() {
  let b = text(600, 56, "Bucket histogram bersifat kumulatif", { size: 34, weight: 800, anchor: "middle" });
  b += text(600, 96, "Contoh: 100 request /api, http_request_duration_seconds_bucket", M({ size: 19, anchor: "middle" }));
  const data = [["0.05", 30], ["0.1", 62], ["0.2", 88], ["0.3", 95], ["0.5", 98], ["1", 99], ["2", 100], ["5", 100], ["+Inf", 100]];
  const X0 = 120, W = 112, Y0 = 540, H = 360;
  b += line(X0 - 20, Y0, X0 + data.length * W, Y0, { sw: 3 });
  data.forEach(([le, n], i) => {
    const x = X0 + i * W, h = (H * n) / 100, hot = le === "0.3";
    b += box(x + 14, Y0 - h, W - 28, h, { fill: hot ? M3 : M1, r: 8, sw: hot ? 5 : 3 });
    b += text(x + W / 2, Y0 - h - 14, n, S({ size: 22, weight: 800, anchor: "middle" }));
    b += text(x + W / 2, Y0 + 34, `le="${le}"`, M({ size: 18, weight: hot ? 800 : 500, anchor: "middle" }));
  });
  b += text(X0 + 3.5 * W, Y0 + 72, "batas SLO 300 ms", S({ size: 19, weight: 800, anchor: "middle" }));
  b += box(40, 650, 1120, 170, { r: 16, sw: 3 });
  b += text(64, 690, "Bucket le=\"0.3\" berisi semua request yang selesai dalam 300 ms atau kurang, termasuk isi le=\"0.1\".", S({ size: 19 }));
  b += text(64, 724, "Rasio lambat = 1 - bucket{le=\"0.3\"} / _count = 1 - 95/100 = 5%: anggaran latensi pas habis.", M({ size: 18, weight: 700 }));
  b += text(64, 758, "Tanpa bucket 0.3, Prometheus hanya tahu angka di le=\"0.2\" dan le=\"0.5\" dan harus menebak di antaranya.", S({ size: 19 }));
  b += text(64, 792, "Bucket +Inf selalu sama dengan _count: jumlah semua request.", S({ size: 19 }));
  return frame("Histogram kumulatif dari 100 request: bucket 0.05 berisi 30, 0.1 berisi 62, 0.2 berisi 88, 0.3 berisi 95, sampai +Inf berisi 100; rasio lambat 5 persen", 850, b);
}

const DIAGRAMS = { "tumpukan-observabilitas": tumpukan, "burn-rate-jendela": burnRate, "histogram-kumulatif": histogram };
mkdirSync("public/studio/monitoring-layanan", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/monitoring-layanan/${name}.svg`, draw());
  console.log(name);
}
