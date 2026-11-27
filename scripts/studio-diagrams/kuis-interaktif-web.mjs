// Diagrams for Studio Proyek "kuis-interaktif-web", embedded as ![ket](/studio/kuis-interaktif-web/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/kuis-interaktif-web.mjs
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

// Three screens in one page; buttons move between them, focus lands on each heading.
function tigaLayar() {
  let b = text(600, 58, "Satu halaman, tiga layar", { size: 40, weight: 800, anchor: "middle" });
  const phone = (x, title, id) => box(x, 110, 320, 460, { r: 26 }) + text(x + 24, 150, title, { size: 26, weight: 800 }) + text(x + 24, 178, id, { size: 17, weight: 600, mono: true });
  // Mulai
  b += phone(40, "Mulai", "#layar-mulai");
  b += text(64, 230, "Siap menguji dirimu?", { size: 21, weight: 700 }) + bar(64, 256, 250) + bar(64, 282, 190);
  b += `<rect x="64" y="320" width="22" height="22" rx="4" fill="#ffffff" stroke="${INK}" stroke-width="3"/>` + text(96, 338, "Batas waktu 20 dtk", S({ size: 18 }));
  b += text(64, 400, "Skor tertinggi: 75%", S({ size: 18 }));
  b += btn(64, 490, 272, "Mulai kuis");
  // Soal
  b += phone(440, "Soal", "#layar-soal");
  b += text(464, 220, "Soal 3 dari 8", { size: 17, weight: 700 }) + text(736, 220, "Skor: 2", { size: 17, weight: 700, anchor: "end" });
  b += `<rect x="464" y="232" width="272" height="12" rx="6" fill="#ffffff" stroke="${INK}" stroke-width="2"/><rect x="464" y="232" width="102" height="12" rx="6" fill="${M3}" stroke="${INK}" stroke-width="2"/>`;
  b += text(464, 278, "Pertanyaan (h2)", { size: 19, weight: 800 });
  ["Pilihan A", "Pilihan B", "Pilihan C"].forEach((t, i) => {
    const y = 296 + i * 52;
    b += box(464, y, 272, 42, { r: 10, sw: 2, fill: i === 1 ? M1 : "#ffffff" }) + radio(486, y + 21, i === 1) + text(506, y + 28, t, S({ size: 18 }));
  });
  b += box(464, 456, 272, 30, { r: 8, sw: 2, fill: M1 }) + text(476, 477, "umpan balik (aria-live)", S({ size: 16 }));
  b += btn(464, 500, 272, "Periksa / Berikutnya");
  // Hasil
  b += phone(840, "Hasil", "#layar-hasil");
  b += text(864, 230, "Skor 6 dari 8 (75%)", { size: 21, weight: 800 }) + text(864, 260, "Rekor baru!", S({ size: 18 }));
  b += text(864, 304, "Tinjau yang salah", { size: 18, weight: 700 });
  [0, 1].forEach((i) => { const y = 322 + i * 70; b += text(864, y + 18, `${i + 1}.`, S({ size: 18 })) + bar(890, y + 6, 220) + bar(890, y + 32, 160, 12); });
  b += btn(864, 490, 272, "Main lagi");
  // Arrows
  b += arrow(362, 160, 432, 160) + text(397, 146, "Mulai", { size: 18, weight: 700, anchor: "middle" });
  b += arrow(762, 160, 832, 160) + text(797, 128, "soal", { size: 18, weight: 700, anchor: "middle" }) + text(797, 146, "terakhir", { size: 18, weight: 700, anchor: "middle" });
  b += `<path d="M738 520 C 800 520, 800 316, 744 316" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" marker-end="url(#ah)"/>`;
  b += text(600, 604, "soal belum habis: Berikutnya, kembali ke pertanyaan", S({ size: 18, anchor: "middle" }));
  b += `<path d="M1000 572 C 1000 690, 200 690, 200 580" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 10" marker-end="url(#ah)"/>`;
  b += `<rect x="540" y="642" width="120" height="30" fill="#ffffff"/>` + text(600, 664, "Main lagi", { size: 18, weight: 700, anchor: "middle" });
  b += note(740, "Ketiga layar ada di index.html sejak awal; JavaScript hanya mengatur atribut hidden.");
  b += note(778, "Setiap kali layar berganti, fokus dipindahkan ke judul layar itu (h2 dengan tabindex=-1).");
  return frame("Tiga layar kuis: Mulai, Soal, Hasil, dengan tombol yang berpindah di antaranya", 810, b, AH);
}

// Fisher-Yates walk on four options.
function fisherYates() {
  let b = text(600, 58, "Fisher-Yates: kunci satu posisi dari belakang", { size: 40, weight: 800, anchor: "middle" });
  const rows = [
    { arr: ["A", "B", "C", "D"], i: 3, j: 1, lock: 4, cap: "i = 3, j acak dari 0..3 = 1: tukar a[3] dan a[1]" },
    { arr: ["A", "D", "C", "B"], i: 2, j: 2, lock: 3, cap: "i = 2, j acak dari 0..2 = 2: tetap di tempat (boleh)" },
    { arr: ["A", "D", "C", "B"], i: 1, j: 0, lock: 2, cap: "i = 1, j acak dari 0..1 = 0: tukar a[1] dan a[0]" },
    { arr: ["D", "A", "C", "B"], i: -1, j: -1, lock: 0, cap: "selesai: setiap 24 urutan punya peluang sama" },
  ];
  rows.forEach((r, k) => {
    const y = 110 + k * 140;
    b += text(40, y + 52, k < 3 ? `Putaran ${k + 1}` : "Hasil", { size: 22, weight: 800 });
    r.arr.forEach((v, n) => {
      const x = 200 + n * 100;
      const locked = n >= r.lock;
      const hot = n === r.i || n === r.j;
      b += box(x, y + 12, 80, 64, { r: 12, sw: hot ? 5 : 3, fill: locked ? M3 : hot ? M1 : "#ffffff" }) + text(x + 40, y + 56, v, { size: 30, weight: 800, anchor: "middle" });
      b += text(x + 40, y + 100, `[${n}]`, S({ size: 16, anchor: "middle", mono: true }));
    });
    if (r.i >= 0 && r.i !== r.j) {
      const x1 = 240 + r.j * 100, x2 = 240 + r.i * 100;
      b += `<path d="M${x1} ${y + 10} C ${x1} ${y - 22}, ${x2} ${y - 22}, ${x2} ${y + 8}" fill="none" stroke="${INK}" stroke-width="4" marker-end="url(#ah)"/>`;
    }
    b += text(620, y + 52, r.cap, S({ size: 20 }));
  });
  b += box(200, 680, 26, 26, { r: 6, sw: 3, fill: M3 }) + text(238, 700, "sudah dikunci", S({ size: 20 }));
  b += box(420, 680, 26, 26, { r: 6, sw: 3, fill: M1 }) + text(458, 700, "sedang ditukar", S({ size: 20 }));
  b += note(760, "sort(() => Math.random() - 0.5) tidak menjamin peluang sama; Fisher-Yates menjaminnya.");
  return frame("Algoritma Fisher-Yates mengacak empat pilihan dengan menukar dari belakang ke depan", 800, b, AH);
}

// Focus path through one question, with the live region speaking on the side.
function alurFokus() {
  let b = text(600, 58, "Ke mana fokus pergi dalam satu soal", { size: 40, weight: 800, anchor: "middle" });
  const st = [
    ["1", "Judul soal", "h2 tabindex=-1", "tampilkanSoal() lalu .focus()", M1],
    ["2", "Grup radio", "Tab, lalu panah", "fieldset + legend: pertanyaan dibacakan", "#ffffff"],
    ["3", "Periksa", "Enter", "form submit, periksa() menilai", "#ffffff"],
    ["4", "Berikutnya", "fokus dipindah", "tombol Periksa disembunyikan", M3],
  ];
  st.forEach(([n, t, k, d, f], i) => {
    const x = 40 + i * 290;
    b += box(x, 120, 250, 170, { r: 18, fill: f }) + `<circle cx="${x + 34}" cy="${154}" r="20" fill="${INK}"/>` + text(x + 34, 162, n, { size: 22, weight: 800, anchor: "middle", fill: "#ffffff" });
    b += text(x + 64, 162, t, { size: 23, weight: 800 }) + text(x + 20, 210, k, { size: 19, weight: 700, mono: true });
    const words = d.split(" "); let l1 = "", l2 = "";
    for (const w of words) ((l1 + " " + w).length < 24 && !l2 ? (l1 = (l1 + " " + w).trim()) : (l2 = (l2 + " " + w).trim()));
    b += text(x + 20, 246, l1, S({ size: 17 })) + text(x + 20, 270, l2, S({ size: 17 }));
    if (i < 3) b += arrow(x + 252, 205, x + 284, 205);
  });
  // live region
  b += box(560, 360, 600, 140, { r: 18, dash: "10 8", sw: 3, fill: M1 }) + text(584, 398, '#umpan-balik  aria-live="polite"', { size: 20, weight: 800, mono: true });
  b += text(584, 440, "✓ Benar!  /  ✗ Kurang tepat. Jawaban yang benar: ...", S({ size: 19 }));
  b += text(584, 474, "dibacakan otomatis tanpa memindahkan fokus", S({ size: 19 }));
  b += `<path d="M745 292 C 745 330, 760 340, 780 356" fill="none" stroke="${INK}" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" marker-end="url(#ah)"/>`;
  // loop back
  b += line(1105, 292, 1105, 330, { sw: 5 }) + line(1105, 330, 1180, 330, { sw: 5 }) + line(1180, 330, 1180, 96, { sw: 5 }) + line(1180, 96, 165, 96, { sw: 5 }) + arrow(165, 96, 165, 114);
  b += text(660, 88, "Enter: soal berikutnya, fokus kembali ke judul soal baru", S({ size: 18, anchor: "middle" }));
  b += box(40, 360, 480, 140, { r: 18 }) + text(64, 398, "Kalau fokus tidak dipindah:", { size: 21, weight: 800 });
  b += text(64, 438, "elemen fokus disembunyikan, fokus jatuh", S({ size: 19 })) + text(64, 470, "ke <body>, pengguna mulai Tab dari awal.", S({ size: 19 }));
  b += note(560, "Wilayah aria-live harus sudah ada di HTML sebelum isinya diubah.");
  return frame("Perjalanan fokus keyboard dalam satu soal dan wilayah aria-live yang membacakan umpan balik", 600, b, AH);
}

const DIAGRAMS = { "alur-tiga-layar": tigaLayar, "fisher-yates": fisherYates, "alur-fokus": alurFokus };
mkdirSync("public/studio/kuis-interaktif-web", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/kuis-interaktif-web/${name}.svg`, draw());
  console.log(name);
}
