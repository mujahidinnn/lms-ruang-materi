// Diagrams for Studio Proyek "deploy-aplikasi-docker", same look as scripts/praktik.mjs.
//   node scripts/studio-diagrams/deploy-aplikasi-docker.mjs
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
const dashBox = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="12 9"/>`;
const label = (x, y, s, o = {}) => text(x, y, s, S({ size: 19, weight: 800, ...o }));

function arsitekturServer() {
  let b = text(600, 56, "Satu VPS, tiga container, hanya caddy yang menghadap internet", { size: 32, weight: 800, anchor: "middle" });
  b += box(40, 170, 160, 290, { r: 18 }) + text(120, 322, "Internet", { size: 26, weight: 800, anchor: "middle" });
  b += box(250, 90, 920, 680, { fill: "#ffffff", r: 22 });
  b += text(274, 130, "VPS Ubuntu LTS", { size: 26, weight: 800 }) + text(1146, 130, "ufw: hanya 22, 80, 443", M({ size: 19, weight: 700, anchor: "end" }));
  b += node(445, 160, 290, 100, "sshd :22", ["user deploy, hanya kunci"]);
  b += arrow(204, 210, 294, 210) + label(212, 196, "22");
  b += dashBox(280, 290, 860, 330) + text(304, 326, "docker compose  (~/app/compose.yaml)", M({ size: 19, weight: 700 }));
  b += node(425, 350, 230, 130, "caddy", ["80, 443", "HTTPS otomatis"], M3);
  b += node(720, 350, 240, 130, "app", ["image sha-...", "127.0.0.1:3000"], M1);
  b += node(1010, 350, 220, 130, "db", ["postgres:18", "tanpa port"], M1);
  b += arrow(204, 415, 304, 415) + label(206, 401, "80/443", { size: 17 });
  b += arrow(540, 415, 594, 415) + arrow(840, 415, 894, 415);
  b += text(567, 506, "app:3000", M({ size: 17, anchor: "middle" })) + text(867, 506, "db:5432", M({ size: 17, anchor: "middle" }));
  const vol = (x, name, sub) => box(x - 115, 530, 230, 70, { fill: "#ffffff", r: 35, sw: 3 }) + text(x, 560, name, M({ size: 19, weight: 800, anchor: "middle" })) + text(x, 586, sub, S({ size: 17, anchor: "middle" }));
  b += line(425, 480, 425, 530, { sw: 3 }) + vol(425, "caddy_data", "sertifikat TLS");
  b += line(1010, 480, 1010, 530, { sw: 3 }) + vol(1010, "pgdata", "/var/lib/postgresql");
  b += node(430, 650, 260, 96, ".env", ["chmod 600, tidak di Git"]);
  b += node(860, 650, 520, 96, "backup.sh  (cron tiap malam)", ["pg_dump -> backups/*.sql.gz, simpan 7 hari"]);
  b += arrow(1010, 604, 1010, 644, { dash: "8 8" });
  b += note(812, "Port yang dipublikasikan Docker melewati ufw. Karena itu app hanya di 127.0.0.1 dan db tanpa port.");
  b += note(846, "Volume bertahan saat container dibuang; deploy hanya mengganti container app.");
  return frame("Arsitektur server: internet hanya bisa ke sshd port 22 dan caddy port 80 dan 443; caddy meneruskan ke app port 3000 dan app ke db port 5432 lewat jaringan internal; volume caddy_data dan pgdata; backup malam", 880, b, AH);
}

function rilisRollback() {
  let b = text(600, 56, "Rilis otomatis: dari git push sampai rollback sendiri", { size: 34, weight: 800, anchor: "middle" });
  const step = (x, n, t, sub, fill = "#ffffff") => {
    let s = box(x, 96, 250, 130, { fill, r: 16 }) + circle(x + 30, 126, 18, { fill: M3, sw: 3 }) + text(x + 30, 134, n, { size: 22, weight: 800, anchor: "middle" });
    s += text(x + 58, 136, t, S({ size: 22, weight: 800 }));
    return s + sub.map((l, i) => text(x + 20, 172 + i * 26, l, M({ size: 17 }))).join("");
  };
  b += step(40, 1, "git push", ["ke main", "(laptop)"]);
  b += step(330, 2, "job build", ["tag sha-1a2b3c4", "dan latest"], M1);
  b += step(620, 3, "GHCR", ["ghcr.io/user/", "pengunjung"], M1);
  b += step(910, 4, "job deploy", ["kunci SSH dari", "Secrets"], M1);
  b += arrow(294, 161, 324, 161) + arrow(584, 161, 614, 161) + arrow(874, 161, 904, 161);
  b += line(1035, 226, 1035, 262) + line(1035, 262, 300, 262) + arrow(300, 262, 300, 292);
  b += text(668, 290, "ssh deploy@server app/deploy.sh sha-1a2b3c4", M({ size: 18, weight: 700, anchor: "middle" }));
  // deploy.sh steps
  const s2 = (y, n, t) => box(60, y, 480, 66, { r: 14 }) + circle(92, y + 33, 18, { fill: M1, sw: 3 }) + text(92, y + 41, n, { size: 20, weight: 800, anchor: "middle" }) + text(124, y + 41, t, M({ size: 18 }));
  b += s2(300, "a", "sebelumnya = APP_TAG di .env");
  b += s2(390, "b", "APP_TAG=sha-1a2b3c4 ke .env");
  b += s2(480, "c", "docker compose pull app");
  b += s2(570, "d", "up -d --wait --wait-timeout 90");
  b += [366, 456, 546].map((y) => arrow(300, y, 300, y + 20)).join("");
  // decision
  b += `<polygon points="820,548 940,603 820,658 700,603" fill="${M1}" stroke="${INK}" stroke-width="4"/>` + text(820, 598, "healthcheck", S({ size: 19, weight: 800, anchor: "middle" })) + text(820, 622, "lolos?", S({ size: 19, weight: 800, anchor: "middle" }));
  b += arrow(540, 603, 694, 603);
  b += box(620, 300, 540, 130, { fill: M3, r: 16 });
  b += text(644, 340, "Ya: rilis selesai", S({ size: 22, weight: 800 }));
  b += text(644, 374, "catat \"tag lama -> tag baru\" di rilis.log", S({ size: 19 })) + text(644, 402, "image prune, job deploy hijau", S({ size: 19 }));
  b += arrow(820, 544, 820, 436) + label(834, 500, "ya");
  b += box(620, 700, 540, 150, { fill: PINK, r: 16 });
  b += text(644, 740, "Tidak: rollback otomatis", S({ size: 22, weight: 800 }));
  b += text(644, 774, "APP_TAG dikembalikan ke tag lama, up -d --wait", S({ size: 19 })) + text(644, 802, "exit 1: job deploy merah", S({ size: 19 })) + text(644, 830, "versi lama tetap melayani pengunjung", S({ size: 19 }));
  b += arrow(820, 662, 820, 694) + label(834, 686, "tidak");
  b += box(60, 700, 480, 150, { r: 16, sw: 3 });
  b += text(84, 740, "Rollback manual", S({ size: 22, weight: 800 }));
  b += text(84, 776, "cat ~/app/rilis.log", M({ size: 18 })) + text(84, 804, "~/app/deploy.sh sha-<tag lama>", M({ size: 18 }));
  b += text(84, 834, "tag lama masih ada di GHCR", S({ size: 18 }));
  b += note(900, "Tag latest hanya penunjuk. Deploy selalu memakai tag sha-..., jadi setiap versi bisa dipanggil lagi.");
  return frame("Alur rilis: git push memicu job build yang mendorong image bertag sha ke GHCR, job deploy menjalankan deploy.sh lewat SSH; kalau healthcheck tidak lolos dalam 90 detik, tag lama dikembalikan dan job gagal", 940, b, AH);
}

const DIAGRAMS = { "arsitektur-server": arsitekturServer, "rilis-rollback": rilisRollback };
mkdirSync("public/studio/deploy-aplikasi-docker", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/deploy-aplikasi-docker/${name}.svg`, draw());
  console.log(name);
}
