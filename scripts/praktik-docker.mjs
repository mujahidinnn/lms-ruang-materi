// Draws the diagrams of the Docker dan Deployment class into public/praktik/
// (embedded in chapters with ![ket](gambar:docker-...)). Same look as
// scripts/praktik.mjs: white sheet, ink line, matcha accents.
//
//   node scripts/praktik-docker.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const INK = "#0f100d", M1 = "#e3edc8", M3 = "#b5d36f", PINK = "#f4b6c2", GREY = "#eef0ea";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const frame = (title, height, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 ${height}" width="1200" height="${height}" role="img" aria-labelledby="t" font-family="system-ui, 'Segoe UI', Roboto, sans-serif">
<title id="t">${esc(title)}</title>
<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${INK}"/></marker></defs>
<rect width="1200" height="${height}" fill="#ffffff"/>
${body}
</svg>
`;
const text = (x, y, s, { size = 26, weight = 600, anchor = "start", fill = INK, mono = false } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}"${mono ? ' font-family="ui-monospace, Menlo, Consolas, monospace"' : ""}>${esc(s)}</text>`;
const box = (x, y, w, h, { fill = "#ffffff", r = 14, sw = 4, dash } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
const arrow = (x1, y1, x2, y2, { dash, both } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="4" stroke-linecap="round" marker-end="url(#ah)"${both ? ' marker-start="url(#ah)"' : ""}${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
const title = (s) => text(600, 64, s, { size: 38, weight: 800, anchor: "middle" });
// A centered label inside a box, one or two lines.
const label = (x, y, w, h, lines, o = {}) => {
  const ls = Array.isArray(lines) ? lines : [lines];
  const size = o.size ?? 26;
  const y0 = y + h / 2 - ((ls.length - 1) * (size + 6)) / 2 + size / 3;
  return ls.map((l, i) => text(x + w / 2, y0 + i * (size + 6), l, { size, anchor: "middle", weight: o.weight ?? 600, mono: o.mono })).join("");
};
const tile = (x, y, w, h, lines, o = {}) => box(x, y, w, h, o) + label(x, y, w, h, lines, o);

function vmVsContainer() {
  const col = (x, head, stack) => {
    let s = text(x + 250, 130, head, { size: 32, weight: 800, anchor: "middle" });
    stack.forEach(([lines, fill, h], i) => {
      const y = 160 + stack.slice(0, i).reduce((a, [, , hh]) => a + hh + 12, 0);
      s += tile(x, y, 500, h, lines, { fill, size: 24 });
    });
    return s;
  };
  const vm = [
    [["Aplikasi A", "Library A"], M1, 74],
    [["Guest OS lengkap (kernel sendiri)"], GREY, 64],
    [["Aplikasi B", "Library B"], M1, 74],
    [["Guest OS lengkap (kernel sendiri)"], GREY, 64],
    [["Hypervisor"], PINK, 56],
    [["Sistem operasi host"], GREY, 56],
    [["Perangkat keras"], "#ffffff", 56],
  ];
  const ct = [
    [["Aplikasi A", "Library A"], M1, 74],
    [["Aplikasi B", "Library B"], M1, 74],
    [["Aplikasi C", "Library C"], M1, 74],
    [["Container engine (Docker)"], PINK, 56],
    [["Sistem operasi host (satu kernel bersama)"], GREY, 64],
    [["Perangkat keras"], "#ffffff", 56],
  ];
  return frame("Mesin virtual dibanding container", 760, title("Mesin virtual dan container") + col(50, "Mesin virtual", vm) + col(650, "Container", ct) + text(600, 740, "Container berbagi kernel host, jadi lebih kecil dan start dalam hitungan detik.", { size: 24, anchor: "middle", weight: 500 }));
}

function imageLayers() {
  const layers = [
    ["COPY . .  (kode aplikasimu)", M3],
    ["RUN npm ci  (node_modules)", M1],
    ["COPY package*.json ./", M1],
    ["WORKDIR /app", M1],
    ["FROM node:24-alpine  (base image)", GREY],
  ];
  let s = title("Image berlapis dan container di atasnya");
  s += text(60, 130, "Image (hanya baca)", { size: 30, weight: 800 });
  layers.forEach(([l, f], i) => (s += tile(60, 160 + i * 78, 560, 68, l, { fill: f, size: 24, mono: true })));
  s += text(700, 130, "Container (hasil docker run)", { size: 30, weight: 800 });
  s += tile(700, 160, 440, 68, ["Lapisan tulis container", "log, file sementara"], { fill: PINK, size: 22 });
  s += tile(700, 238, 440, 230, ["Lapisan image dipakai bersama", "oleh semua container dari image ini"], { fill: "#ffffff", size: 22, dash: "10 8" });
  s += arrow(625, 300, 695, 300);
  s += text(600, 590, "Layer yang tidak berubah dipakai ulang dari cache. Ubah satu baris,", { size: 23, weight: 500, anchor: "middle" });
  s += text(600, 624, "layer sesudahnya ikut dibuild ulang.", { size: 23, weight: 500, anchor: "middle" });
  s += text(600, 668, "Container dihapus: lapisan tulisnya hilang. Data awet disimpan di volume.", { size: 23, weight: 500, anchor: "middle" });
  return frame("Image terdiri dari layer hanya baca, container menambah satu lapisan tulis", 710, s);
}

function multiStage() {
  let s = title("Multi-stage build");
  s += tile(40, 140, 400, 360, [], { fill: GREY });
  s += text(240, 180, "Stage build", { size: 30, weight: 800, anchor: "middle" });
  s += label(40, 210, 400, 250, ["FROM node:24 AS build", "npm ci (semua dependency)", "npm run build", "kompiler, devDependencies,", "kode sumber"], { size: 22 });
  s += tile(760, 140, 400, 360, [], { fill: M1 });
  s += text(960, 180, "Stage final", { size: 30, weight: 800, anchor: "middle" });
  s += label(760, 210, 400, 250, ["FROM node:24-alpine", "npm ci --omit=dev", "COPY --from=build /app/dist", "USER node", "CMD node dist/server.js"], { size: 22 });
  s += arrow(445, 330, 755, 330);
  s += text(600, 305, "hanya hasil build", { size: 22, anchor: "middle", weight: 500 });
  s += text(240, 540, "dibuang, tidak ikut image", { size: 24, anchor: "middle", weight: 600 });
  s += text(960, 540, "image yang dikirim ke server", { size: 24, anchor: "middle", weight: 600 });
  s += text(600, 610, "Image akhir hanya berisi yang dibutuhkan untuk menjalankan aplikasi.", { size: 24, anchor: "middle", weight: 500 });
  return frame("Stage build dibuang, hanya hasilnya yang disalin ke image final", 650, s);
}

function volumeNetwork() {
  let s = title("Volume, network, dan port");
  s += tile(30, 200, 200, 110, ["Host", "localhost:8080"], { fill: "#ffffff", size: 24 });
  s += arrow(235, 255, 345, 255);
  s += text(130, 345, "-p 8080:3000", { size: 22, anchor: "middle", mono: true, weight: 600 });
  s += tile(300, 110, 870, 420, [], { fill: GREY, dash: "12 8" });
  s += text(320, 150, "Network app-net (bridge buatan sendiri)", { size: 24, weight: 700 });
  s += tile(350, 200, 250, 110, ["api", "port 3000"], { fill: M1, size: 26 });
  s += tile(860, 200, 250, 110, ["db", "port 5432"], { fill: M1, size: 26 });
  s += arrow(605, 255, 855, 255, { both: true });
  s += text(730, 240, "db:5432", { size: 22, anchor: "middle", mono: true, weight: 600 });
  s += tile(860, 400, 250, 90, ["volume pgdata"], { fill: PINK, size: 24 });
  s += arrow(985, 315, 985, 395);
  s += text(970, 360, "/var/lib/postgresql", { size: 18, anchor: "end", mono: true, weight: 500 });
  s += tile(350, 400, 250, 90, ["bind mount ./src"], { fill: PINK, size: 24 });
  s += arrow(475, 315, 475, 395);
  s += text(600, 585, "Antar container: pakai nama service. Dari host: lewat port yang dipublikasikan.", { size: 24, anchor: "middle", weight: 500 });
  s += text(600, 625, "Data yang awet: volume (dikelola Docker) atau bind mount (folder host).", { size: 24, anchor: "middle", weight: 500 });
  return frame("Container saling bicara lewat nama di network, data awet di volume", 660, s);
}

function composeStack() {
  let s = title("Satu compose.yaml, tiga service");
  s += tile(40, 110, 1120, 410, [], { fill: GREY, dash: "12 8" });
  s += text(60, 150, "compose.yaml  (docker compose up -d)", { size: 24, weight: 700, mono: true });
  s += tile(80, 200, 280, 150, ["proxy", "caddy:2", "80, 443 terbuka"], { fill: PINK, size: 24 });
  s += tile(460, 200, 280, 150, ["api", "image buatanmu", "port 3000 internal"], { fill: M1, size: 24 });
  s += tile(840, 200, 280, 150, ["db", "postgres:17-alpine", "port 5432 internal"], { fill: M1, size: 24 });
  s += arrow(365, 275, 455, 275);
  s += arrow(745, 275, 835, 275);
  s += tile(840, 400, 280, 90, ["volume pgdata"], { fill: "#ffffff", size: 24 });
  s += arrow(980, 355, 980, 395);
  s += tile(460, 400, 280, 90, [".env / secrets"], { fill: "#ffffff", size: 24 });
  s += arrow(600, 395, 600, 355);
  s += text(600, 575, "Internet hanya mengenal proxy. api dan db tidak punya port publik.", { size: 24, anchor: "middle", weight: 500 });
  return frame("Compose menjalankan proxy, api, dan db di satu network", 620, s);
}

function reverseProxy() {
  let s = title("Reverse proxy dan HTTPS");
  s += tile(30, 200, 200, 120, ["Browser"], { fill: "#ffffff", size: 28 });
  s += tile(360, 150, 330, 220, [], { fill: PINK });
  s += label(360, 150, 330, 220, ["Reverse proxy", "(Caddy atau Nginx)", "sertifikat TLS", "port 80 dan 443"], { size: 24 });
  s += tile(820, 200, 340, 120, ["Aplikasi Node", "api:3000"], { fill: M1, size: 26 });
  s += arrow(235, 260, 355, 260);
  s += text(295, 235, "HTTPS", { size: 22, anchor: "middle", weight: 700 });
  s += arrow(695, 260, 815, 260);
  s += text(755, 235, "HTTP", { size: 22, anchor: "middle", weight: 700 });
  s += text(130, 370, "app.contoh.id", { size: 22, anchor: "middle", mono: true, weight: 600 });
  s += tile(360, 450, 330, 90, ["Let's Encrypt"], { fill: "#ffffff", size: 26 });
  s += arrow(525, 445, 525, 375, { both: true });
  s += text(560, 420, "sertifikat otomatis", { size: 20, weight: 500 });
  s += text(600, 600, "Enkripsi berakhir di proxy; lalu lintas ke aplikasi berjalan di network internal.", { size: 24, anchor: "middle", weight: 500 });
  return frame("Browser terhubung lewat HTTPS ke reverse proxy yang meneruskan HTTP ke aplikasi", 650, s);
}

function pipeline() {
  const steps = [
    ["git push", "ke main"],
    ["Test", "npm test"],
    ["Build", "docker build"],
    ["Push", "ke GHCR"],
    ["Deploy", "ssh + compose"],
  ];
  let s = title("Pipeline CI/CD sederhana");
  steps.forEach(([a, b], i) => {
    const x = 30 + i * 232;
    s += tile(x, 200, 190, 130, [a, b], { fill: i < 2 ? M1 : i < 4 ? M3 : PINK, size: 23 });
    if (i < 4) s += arrow(x + 195, 265, x + 227, 265);
  });
  s += text(125, 400, "CI", { size: 28, anchor: "middle", weight: 800 });
  s += text(357, 400, "CI", { size: 28, anchor: "middle", weight: 800 });
  s += text(589, 400, "CI", { size: 28, anchor: "middle", weight: 800 });
  s += text(821, 400, "CI", { size: 28, anchor: "middle", weight: 800 });
  s += text(1053, 400, "CD", { size: 28, anchor: "middle", weight: 800 });
  s += text(600, 480, "Test gagal: pipeline berhenti di situ dan tidak ada yang sampai ke server.", { size: 24, anchor: "middle", weight: 500 });
  s += text(600, 520, "Rahasia (kunci SSH, token) disimpan di GitHub Secrets, bukan di repo.", { size: 24, anchor: "middle", weight: 500 });
  return frame("Dari git push sampai deploy: test, build, push image, lalu deploy ke server", 570, s);
}

const DIAGRAMS = {
  "docker-vm-vs-container": vmVsContainer,
  "docker-image-layers": imageLayers,
  "docker-multi-stage": multiStage,
  "docker-volume-network": volumeNetwork,
  "docker-compose-stack": composeStack,
  "docker-reverse-proxy-https": reverseProxy,
  "docker-cicd-pipeline": pipeline,
};

mkdirSync("public/praktik", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/praktik/${name}.svg`, draw());
  console.log(name);
}
