// Diagrams for Studio Proyek "tebak-angka-python", embedded as ![ket](/studio/tebak-angka-python/<nama>.svg).
// Helpers copied from scripts/praktik.mjs (importing it would redraw public/praktik).
//   node scripts/studio-diagrams/tebak-angka-python.mjs
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

// Module split: pure rules, file I/O, and the loop that receives its I/O as parameters.
function modul() {
  let b = text(600, 58, "Aturan murni, input-output disuntikkan", { size: 40, weight: 800, anchor: "middle" });
  b += box(40, 110, 640, 250, { r: 18 }) + text(64, 152, "__init__.py", { size: 28, weight: 800, mono: true });
  b += text(64, 190, "main(tanya, tulis, acak, berkas)", { size: 22, weight: 700, mono: true });
  [["tanya", "input"], ["tulis", "print"], ["acak", "random.Random()"], ["berkas", "~/.tebak-angka.json"]].forEach(([k, v], i) => {
    b += text(84, 232 + i * 32, `${k.padEnd(6)} = ${v}`, { size: 20, weight: 500, mono: true });
  });
  b += box(780, 110, 380, 250, { r: 18, dash: "10 8", sw: 3, fill: M1 }) + text(804, 152, "Saat dites (pytest)", { size: 24, weight: 800 });
  ['jawaban("1", "15")', "keluar.append", "AcakTetap(15)", 'tmp_path / "rekor.json"'].forEach((v, i) => {
    b += text(804, 232 + i * 32, v, { size: 20, weight: 500, mono: true });
  });
  b += arrow(774, 235, 688, 235) + text(731, 220, "ganti", { size: 18, weight: 700, anchor: "middle" });
  b += box(40, 450, 420, 180, { r: 18, fill: M3 }) + text(64, 492, "logika.py", { size: 26, weight: 800, mono: true });
  b += text(64, 530, "LEVEL, baca_tebakan, suhu,", S({ size: 20, mono: true })) + text(64, 558, "petunjuk, hitung_skor", S({ size: 20, mono: true }));
  b += text(64, 600, "murni: nilai masuk, nilai keluar", S({ size: 20 }));
  b += box(520, 450, 380, 180, { r: 18 }) + text(544, 492, "rekor.py", { size: 26, weight: 800, mono: true });
  b += text(544, 530, "muat_rekor, simpan_rekor", S({ size: 20, mono: true }));
  b += text(544, 566, "hilang / rusak: {}", S({ size: 20 })) + text(544, 600, "tulis .tmp, lalu replace", S({ size: 20 }));
  b += `<path d="M960 455 h150 l40 40 v135 h-190 z" fill="#ffffff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M1110 455 v40 h40" fill="none" stroke="${INK}" stroke-width="4"/>`;
  b += text(1055, 552, "rekor", { size: 20, weight: 700, anchor: "middle" }) + text(1055, 582, ".json", { size: 20, weight: 700, anchor: "middle", mono: true });
  b += arrow(250, 362, 250, 442) + text(262, 410, "memanggil", S({ size: 18 }));
  b += arrow(600, 362, 650, 442) + text(640, 400, "memanggil", S({ size: 18 }));
  b += arrow(902, 540, 952, 540);
  b += note(690, "Hanya main() yang tahu soal keyboard, layar, dan angka acak.");
  b += note(728, "Tes mengganti keempatnya, jadi game bisa dimainkan tanpa mengetik apa pun.");
  return frame("Tiga modul: logika.py murni, rekor.py menyentuh berkas, main() menerima input, output, random, dan lokasi berkas sebagai parameter", 760, b, AH);
}

// One round: which inputs cost a chance.
function ronde() {
  let b = text(600, 52, "Satu ronde: hanya tebakan valid yang dihitung", { size: 36, weight: 800, anchor: "middle" });
  const node = (x, y, w, t1, t2, o = {}) => box(x, y, w, 90, { r: 16, ...o }) + text(x + w / 2, y + (t2 ? 38 : 54), t1, { size: 21, weight: 800, anchor: "middle", mono: o.mono }) + (t2 ? text(x + w / 2, y + 68, t2, S({ size: 18, anchor: "middle" })) : "");
  b += node(40, 160, 250, "tanya()", "Tebakan (n tersisa):", { fill: M1 });
  b += node(350, 160, 220, "valid?", "baca_tebakan()");
  b += node(640, 160, 220, "sudah ditebak?", "tebakan in sudah");
  b += node(930, 160, 230, "sudah.add()", "kesempatan terpakai +1", { fill: M3 });
  b += node(930, 360, 230, "benar?");
  b += node(930, 520, 230, "Benar!", "return hitung_skor()", { fill: M3 });
  b += node(420, 360, 420, "tulis(petunjuk())", "Terlalu kecil, hangat.");
  b += node(40, 360, 300, "masih ada kesempatan?");
  b += node(40, 520, 300, "Kesempatan habis", "return 0");
  b += arrow(292, 205, 342, 205) + arrow(572, 205, 632, 205) + arrow(862, 205, 922, 205);
  b += text(602, 192, "ya", { size: 18, weight: 700, anchor: "middle" }) + text(892, 192, "tidak", { size: 18, weight: 700, anchor: "middle" });
  b += arrow(1045, 252, 1045, 352) + arrow(1045, 452, 1045, 512) + text(1060, 490, "ya", { size: 18, weight: 700 });
  b += arrow(928, 405, 848, 405) + text(888, 392, "tidak", { size: 18, weight: 700, anchor: "middle" });
  b += arrow(418, 405, 348, 405);
  b += arrow(190, 358, 190, 258) + text(204, 314, "ya", { size: 18, weight: 700 });
  b += arrow(190, 452, 190, 512) + text(204, 490, "tidak", { size: 18, weight: 700 });
  // error loop back to tanya()
  b += line(460, 158, 460, 118, { sw: 5 }) + line(750, 158, 750, 118, { sw: 5 }) + line(750, 118, 165, 118, { sw: 5 }) + arrow(165, 118, 165, 152);
  b += text(472, 146, "tidak", { size: 17, weight: 700 }) + text(762, 146, "ya", { size: 17, weight: 700 });
  b += text(605, 108, "tidak valid / sudah pernah: tulis pesan, tanya lagi", S({ size: 18, anchor: "middle" }));
  b += note(650, "Kesempatan terpakai = len(sudah). Input salah dan tebakan berulang di-continue sebelum add.");
  return frame("Alur satu ronde: input tidak valid atau berulang kembali ke pertanyaan tanpa mengurangi kesempatan; tebakan valid dicatat lalu dicek benar atau tidak", 690, b, AH);
}

const DIAGRAMS = { "modul-dan-suntikan": modul, "alur-satu-ronde": ronde };
mkdirSync("public/studio/tebak-angka-python", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/tebak-angka-python/${name}.svg`, draw());
  console.log(name);
}
