// Renders the assets scripts/deck-linux.py needs into <dir>: lucide icons
// (icons/<name>-w.png white, -k.png green, 256px) and the deck diagrams
// (<name>.png, 2x, plus <name>.svg).
// Run: node scripts/deck-linux-assets.mjs <dir>
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const [dir] = process.argv.slice(2);
if (!dir) throw new Error("usage: node scripts/deck-linux-assets.mjs <dir>");
mkdirSync(join(dir, "icons"), { recursive: true });

const ICONS = "terminal braces list-checks eye user users key-round folder folder-plus folder-tree folder-search file-plus file-text file-code file-output copy move trash asterisk search funnel regex arrow-right-left workflow split cpu activity gauge server lock shield-check package download user-plus users-round repeat bug calendar-clock send upload settings lightbulb rocket clipboard-check book-open".split(" ");
const attr = (o) => Object.entries(o).filter(([k]) => k !== "key").map(([k, v]) => `${k}="${v}"`).join(" ");
for (const name of ICONS) {
  const { __iconData } = await import(`../node_modules/lucide-react/dist/esm/icons/${name}.mjs`);
  const body = __iconData.node.map(([tag, a]) => `<${tag} ${attr(a)}/>`).join("");
  for (const [suffix, color] of [["w", "#ffffff"], ["k", "#10b981"]]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="256" height="256" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
    await sharp(Buffer.from(svg), { density: 300 }).resize(256, 256).png().toFile(join(dir, "icons", `${name}-${suffix}.png`));
  }
}

const INK = "#0f172a", G = "#10b981", GL = "#d1fae5", AM = "#f59e0b", AML = "#fef3c7", SL = "#f1f5f9", RED = "#ef4444", REDL = "#fee2e2";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const t = (x, y, s, { size = 30, w = 600, a = "middle", fill = INK, mono = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${w}" text-anchor="${a}" fill="${fill}"${mono ? ' font-family="DejaVu Sans Mono, monospace"' : ""}>${esc(s)}</text>`;
const box = (x, y, w, h, fill = "#fff", stroke = INK) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;
const line = (x1, y1, x2, y2, stroke = INK, dash = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="4" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
const arrow = (x1, y1, x2, y2, stroke = INK, dash = "") => {
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
  const hx = x2 - ux * 22, hy = y2 - uy * 22;
  return `<line x1="${x1}" y1="${y1}" x2="${hx}" y2="${hy}" stroke="${stroke}" stroke-width="5" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""}/><polygon points="${x2},${y2} ${hx - uy * 12},${hy + ux * 12} ${hx + uy * 12},${hy - ux * 12}" fill="${stroke}"/>`;
};
const sheet = (h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 ${h}" width="1200" height="${h}" font-family="DejaVu Sans, sans-serif"><rect width="1200" height="${h}" fill="#fff"/>${body}</svg>`;

const D = {
  "linux-tree": sheet(900, [
    t(600, 70, "Satu pohon, berakar di /", { size: 40, w: 700 }),
    box(510, 110, 180, 80, INK, INK), t(600, 165, "/", { size: 44, w: 700, fill: "#fff", mono: true }),
    ...[["/etc", "konfigurasi", 110], ["/home", "folder pengguna", 300], ["/var", "data berubah", 490], ["/usr", "program", 680], ["/tmp", "sementara", 870], ["/dev", "perangkat", 1060]].flatMap(([n, d, x]) => [
      line(600, 190, x, 290, INK), box(x - 80, 290, 160, 76, GL, G), t(x, 342, n, { size: 30, w: 700, mono: true }), t(x, 400, d, { size: 22, w: 500 }),
    ]),
    ...[["budi", "/home/budi", 300], ["log", "/var/log", 490], ["bin", "/usr/bin", 680]].flatMap(([n, p, x]) => [
      line(x, 366, x, 500, INK), box(x - 75, 500, 150, 70, AML, AM), t(x, 548, n, { size: 28, w: 700, mono: true }), t(x, 610, p, { size: 20, w: 500, mono: true }),
    ]),
    box(60, 690, 1080, 150, SL),
    t(600, 745, "Flashdisk dan disk lain dipasang (mount) ke cabang pohon,", { size: 28, w: 600 }),
    t(600, 790, "bukan jadi drive terpisah seperti C: dan D:.", { size: 28, w: 600 }),
    t(600, 830, "Semuanya adalah berkas: konfigurasi, perangkat, bahkan info proses.", { size: 22, w: 500 }),
  ].join("")),
  "grep-vs-find": sheet(900, [
    t(600, 70, "grep mencari isi, find mencari berkas", { size: 40, w: 700 }),
    box(40, 130, 540, 560, SL), t(310, 190, "find: nama, tipe, ukuran, umur", { size: 28, w: 700 }),
    ...[["/etc/nginx/nginx.conf", true], ["/etc/ssh/sshd_config", false], ["/etc/hosts", false], ["/var/log/auth.log", false], ["/home/budi/a.conf", true]].map(([p, hit], i) =>
      box(70, 225 + i * 78, 480, 62, hit ? GL : "#fff", hit ? G : "#cbd5e1") + t(90, 265 + i * 78, p, { size: 24, w: hit ? 700 : 500, a: "start", mono: true })),
    t(310, 650, "find /etc -name \"*.conf\"", { size: 24, w: 600, mono: true }),
    box(620, 130, 540, 560, SL), t(890, 190, "grep: baris di dalam berkas", { size: 28, w: 700 }),
    ...[["Failed password for root", true], ["Accepted password for budi", false], ["Failed password for admin", true], ["session opened for root", false], ["sudo: COMMAND=/usr/bin/apt", false]].map(([p, hit], i) =>
      box(650, 225 + i * 78, 480, 62, hit ? GL : "#fff", hit ? G : "#cbd5e1") + t(670, 265 + i * 78, p, { size: 24, w: hit ? 700 : 500, a: "start", mono: true })),
    t(890, 650, "grep Failed auth.log", { size: 24, w: 600, mono: true }),
    box(40, 730, 1120, 120, AML, AM),
    t(600, 785, "Gabungkan: baris mana di berkas .conf yang memuat PermitRootLogin?", { size: 26, w: 600 }),
    t(600, 830, "grep -rn PermitRootLogin /etc/ssh/", { size: 28, w: 700, mono: true }),
  ].join("")),
  "izin-rwx": sheet(900, [
    t(600, 70, "Membaca izin: -rwxr-xr--", { size: 40, w: 700, }),
    box(40, 130, 100, 110, SL), t(90, 205, "-", { size: 52, w: 700, mono: true }), t(90, 275, "tipe", { size: 22, w: 500 }), t(90, 303, "berkas", { size: 22, w: 500 }),
    ...[["rwx", "pemilik (u)", 7, "4+2+1", 170, G, GL], ["r-x", "grup (g)", 5, "4+0+1", 480, AM, AML], ["r--", "lainnya (o)", 4, "4+0+0", 790, RED, REDL]].flatMap(([s, who, n, sum, x, st, fl]) => [
      box(x, 130, 280, 110, fl, st), t(x + 140, 207, s, { size: 54, w: 700, mono: true }),
      t(x + 140, 275, who, { size: 26, w: 700 }),
      box(x + 70, 340, 140, 100, "#fff", st), t(x + 140, 410, String(n), { size: 60, w: 700, mono: true }), t(x + 140, 475, sum, { size: 26, w: 500, mono: true }),
      line(x + 140, 240, x + 140, 262, st),
    ]),
    t(600, 580, "chmod 754 deploy.sh", { size: 40, w: 700, mono: true }),
    box(40, 640, 1120, 200, SL),
    t(130, 700, "r = 4  baca", { size: 28, w: 600, a: "start" }), t(130, 750, "w = 2  tulis", { size: 28, w: 600, a: "start" }), t(130, 800, "x = 1  jalankan atau masuk folder", { size: 28, w: 600, a: "start" }),
    t(1100, 700, "644 berkas biasa", { size: 26, w: 600, a: "end", mono: true }), t(1100, 750, "755 skrip dan folder", { size: 26, w: 600, a: "end", mono: true }), t(1100, 800, "600 rahasia pribadi", { size: 26, w: 600, a: "end", mono: true }),
  ].join("")),
  "pipe-stream": sheet(900, [
    t(600, 70, "Pipe: stdout menjadi stdin berikutnya", { size: 40, w: 700 }),
    box(40, 190, 250, 130, SL), t(165, 245, "cat auth.log", { size: 26, w: 700, mono: true }), t(165, 290, "program 1", { size: 22, w: 500 }),
    box(475, 190, 250, 130, SL), t(600, 245, "grep Failed", { size: 26, w: 700, mono: true }), t(600, 290, "program 2", { size: 22, w: 500 }),
    box(910, 190, 250, 130, SL), t(1035, 245, "wc -l", { size: 26, w: 700, mono: true }), t(1035, 290, "program 3", { size: 22, w: 500 }),
    arrow(292, 255, 473, 255, G), arrow(727, 255, 908, 255, G),
    t(382, 238, "stdout |", { size: 22, w: 700, fill: G }), t(817, 238, "stdout |", { size: 22, w: 700, fill: G }),
    arrow(165, 322, 165, 480, RED, "12 10"), arrow(600, 322, 600, 480, RED, "12 10"), arrow(1035, 322, 1035, 480, RED, "12 10"),
    t(210, 405, "stderr (2)", { size: 22, w: 700, fill: RED, a: "start" }), t(645, 405, "stderr (2)", { size: 22, w: 700, fill: RED, a: "start" }), t(1080, 405, "stderr (2)", { size: 22, w: 700, fill: RED, a: "start" }),
    box(40, 485, 1120, 90, REDL, RED), t(600, 543, "layar: galat tetap tampil, tidak ikut ke pipe", { size: 28, w: 700 }),
    t(40, 130, "keyboard", { size: 24, w: 500, a: "start" }), t(1160, 130, "layar atau berkas", { size: 24, w: 500, a: "end" }),
    box(40, 640, 540, 190, AML, AM), t(310, 695, "Alihkan ke berkas", { size: 28, w: 700 }),
    t(70, 745, "> menimpa", { size: 26, w: 600, a: "start", mono: true }), t(70, 785, ">> menambah", { size: 26, w: 600, a: "start", mono: true }), t(70, 822, "2> galat saja", { size: 26, w: 600, a: "start", mono: true }),
    box(620, 640, 540, 190, GL, G), t(890, 695, "Rangkaian ringkas log", { size: 28, w: 700 }),
    t(650, 745, "awk '{print $1}' log", { size: 24, w: 600, a: "start", mono: true }), t(650, 785, "| sort | uniq -c", { size: 24, w: 600, a: "start", mono: true }), t(650, 822, "| sort -rn | head", { size: 24, w: 600, a: "start", mono: true }),
  ].join("")),
  "proses-sinyal": sheet(900, [
    t(600, 70, "Proses punya induk, dan menerima sinyal", { size: 40, w: 700 }),
    ...[["systemd", "PID 1", 120], ["sshd", "PID 812", 270], ["bash", "PID 2210", 420], ["sleep 300", "PID 5102", 570]].flatMap(([n, p, y], i) => [
      box(40, y, 360, 100, i === 3 ? AML : SL, i === 3 ? AM : INK), t(60, y + 45, n, { size: 28, w: 700, a: "start", mono: true }), t(60, y + 82, p, { size: 22, w: 500, a: "start" }),
      ...(i < 3 ? [arrow(220, y + 102, 220, y + 148)] : []),
    ]),
    t(220, 710, "induk (PPID) melahirkan anak", { size: 24, w: 500 }),
    ...[["SIGTERM  15", "minta berhenti dengan sopan", G, GL], ["SIGKILL  9", "dipaksa kernel, jalan terakhir", RED, REDL], ["SIGINT  2", "Ctrl+C", AM, AML], ["SIGHUP  1", "sesi ditutup atau muat ulang", INK, SL]].flatMap(([n, d, st, fl], i) => [
      box(480, 130 + i * 140, 680, 120, fl, st), t(510, 185 + i * 140, n, { size: 30, w: 700, a: "start", mono: true }), t(510, 227 + i * 140, d, { size: 24, w: 500, a: "start" }),
    ]),
    box(480, 710, 680, 120, "#fff", INK), t(820, 760, "kill 2210   =   SIGTERM", { size: 28, w: 700, mono: true }), t(820, 805, "kill -9 2210  =  SIGKILL", { size: 28, w: 700, mono: true }),
  ].join("")),
  "passwd-kolom": sheet(900, [
    t(600, 70, "Satu baris /etc/passwd, tujuh kolom", { size: 40, w: 700 }),
    ...(() => {
      const cols = [["budi", "nama", 140], ["x", "sandi", 70], ["1000", "UID", 120], ["1000", "GID", 120], ["Budi S.", "keterangan", 160], ["/home/budi", "folder rumah", 220], ["/bin/bash", "shell", 190]];
      let x = 45, out = [];
      cols.forEach(([v, l, w], i) => {
        out.push(box(x, 170, w, 100, i % 2 ? GL : AML, i % 2 ? G : AM), t(x + w / 2, 233, v, { size: v.length > 8 ? 24 : 30, w: 700, mono: true }), t(x + w / 2, 315, l, { size: 20, w: 600 }));
        if (i < cols.length - 1) out.push(t(x + w + 7, 233, ":", { size: 36, w: 700, mono: true }));
        x += w + 14;
      });
      return out;
    })(),
    box(40, 400, 1120, 200, SL), t(600, 455, "UID menentukan jenis akun", { size: 30, w: 700 }),
    box(70, 490, 320, 90, INK, INK), t(230, 545, "0  root", { size: 30, w: 700, fill: "#fff", mono: true }),
    box(440, 490, 320, 90, GL, G), t(600, 545, "1-999  sistem", { size: 28, w: 700, mono: true }),
    box(810, 490, 320, 90, AML, AM), t(970, 545, "1000+  manusia", { size: 28, w: 700, mono: true }),
    box(40, 650, 540, 180, "#fff", INK), t(310, 705, "/etc/shadow", { size: 30, w: 700, mono: true }), t(310, 750, "hash sandi, hanya terbaca root", { size: 24, w: 500 }), t(310, 790, "kolom sandi passwd berisi x", { size: 22, w: 500 }),
    box(620, 650, 540, 180, "#fff", INK), t(890, 705, "sudo", { size: 30, w: 700, mono: true }), t(890, 750, "satu perintah dengan hak root", { size: 24, w: 500 }), t(890, 790, "tercatat di auth.log", { size: 22, w: 500 }),
  ].join("")),
  "ssh-kunci": sheet(900, [
    t(600, 70, "Login dengan kunci, bukan sandi", { size: 40, w: 700 }),
    box(40, 150, 420, 330, SL), t(250, 205, "Laptop kamu", { size: 30, w: 700 }),
    box(80, 245, 340, 90, REDL, RED), t(250, 288, "id_ed25519", { size: 28, w: 700, mono: true }), t(250, 322, "kunci privat, rahasia", { size: 20, w: 600 }),
    box(80, 355, 340, 90, GL, G), t(250, 398, "id_ed25519.pub", { size: 28, w: 700, mono: true }), t(250, 432, "kunci publik, boleh dibagi", { size: 20, w: 600 }),
    box(740, 150, 420, 330, SL), t(950, 205, "Server", { size: 30, w: 700 }),
    box(780, 245, 340, 200, GL, G), t(950, 295, "~/.ssh/authorized_keys", { size: 22, w: 700, mono: true }), t(950, 340, "daftar kunci publik", { size: 22, w: 500 }), t(950, 380, "yang boleh masuk", { size: 22, w: 500 }),
    arrow(735, 300, 465, 300, AM, "12 10"), t(600, 285, "2  tantangan", { size: 22, w: 700, fill: AM }),
    arrow(465, 370, 735, 370, INK), t(600, 355, "3  bukti", { size: 22, w: 700 }),
    arrow(465, 440, 735, 440, G), t(600, 425, "1  ssh-copy-id", { size: 22, w: 700, fill: G, mono: true }),
    box(40, 560, 1120, 280, AML, AM),
    t(600, 615, "Izin yang diwajibkan SSH", { size: 30, w: 700 }),
    t(120, 680, "~/.ssh", { size: 30, w: 700, a: "start", mono: true }), t(520, 680, "700", { size: 34, w: 700, mono: true }),
    t(120, 735, "id_ed25519 (privat)", { size: 28, w: 700, a: "start", mono: true }), t(520, 735, "600", { size: 34, w: 700, mono: true }),
    t(120, 790, "authorized_keys", { size: 28, w: 700, a: "start", mono: true }), t(520, 790, "600", { size: 34, w: 700, mono: true }),
    t(1130, 680, "PermitRootLogin no", { size: 24, w: 600, a: "end", mono: true }), t(1130, 735, "PasswordAuthentication no", { size: 24, w: 600, a: "end", mono: true }), t(1130, 790, "uji lewat sesi cadangan", { size: 24, w: 600, a: "end" }),
  ].join("")),
};
for (const [name, svg] of Object.entries(D)) {
  writeFileSync(join(dir, `${name}.svg`), svg);
  await sharp(Buffer.from(svg), { density: 144 }).png().toFile(join(dir, `${name}.png`));
}
console.log("assets ->", dir, ICONS.length, "icons,", Object.keys(D).length, "diagrams");
