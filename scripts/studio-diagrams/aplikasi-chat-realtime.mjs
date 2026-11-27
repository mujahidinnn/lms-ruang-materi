// Diagrams for Studio Proyek "aplikasi-chat-realtime", same look as scripts/praktik.mjs.
//   node scripts/studio-diagrams/aplikasi-chat-realtime.mjs
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

const num = (x, y, n) => circle(x, y, 17, { fill: M1, sw: 3 }) + text(x, y + 7, n, { size: 19, weight: 800, anchor: "middle" });

function arsitektur() {
  let b = text(600, 62, "Satu pesan, dua instance: jalur kirim di aplikasi chat", { size: 36, weight: 800, anchor: "middle" });
  b += node(230, 100, 300, 90, "Browser A", ["ani, room umum"]);
  b += node(970, 100, 300, 90, "Browser B", ["budi, room umum"]);
  b += node(230, 300, 300, 110, "Instance 1", ["Map room: socket A"], M3);
  b += node(970, 300, 300, 110, "Instance 2", ["Map room: socket B"], M3);
  b += node(600, 300, 240, 110, "Redis", ["pub/sub chat:events"], M1);
  b += node(230, 520, 300, 110, "PostgreSQL", ["tabel messages"], M1);
  // 1 send, 3 ack
  b += arrow(200, 194, 200, 292) + num(170, 243, 1);
  b += arrow(262, 292, 262, 198, { dash: "10 8" }) + num(292, 243, 3);
  // 2 insert
  b += arrow(230, 414, 230, 512) + num(260, 463, 2);
  // 4 publish
  b += arrow(384, 330, 476, 330) + num(430, 300, 4);
  // 5 fan out
  b += arrow(724, 340, 816, 340) + arrow(476, 380, 384, 380) + num(770, 310, 5) + num(430, 410, 5);
  // 6 deliver
  b += arrow(970, 292, 970, 198) + num(1000, 243, 6);
  const steps = [
    ["1", "send", "A mengirim send berisi room, cid, dan text"],
    ["2", "INSERT", "pesan disimpan; cid yang sama tidak tersimpan dua kali"],
    ["3", "ack", "pengirim mendapat id, pesan berhenti tampil pudar"],
    ["4", "PUBLISH", "instance 1 menerbitkan event message ke Redis"],
    ["5", "fan-out", "Redis meneruskan ke semua instance, termasuk instance 1"],
    ["6", "deliver", "tiap instance mengirim ke socket lokal di room itu"],
  ];
  steps.forEach(([n, name, desc], i) => {
    const y = 480 + i * 44;
    b += num(440, y, n) + text(470, y + 7, name, S({ weight: 800, mono: true })) + text(580, y + 7, desc, S({ size: 20 }));
  });
  b += note(770, "Postgres adalah sumber kebenaran. Redis pub/sub tidak menyimpan apa pun: hanya pengantar cepat.");
  return frame("Arsitektur chat: browser A di instance 1 dan browser B di instance 2; pesan disimpan di PostgreSQL lalu disiarkan lewat Redis pub/sub ke semua instance", 810, b, AH);
}

function upgrade() {
  const L = 250, R = 950;
  let b = text(600, 62, "Token diperiksa saat upgrade, sebelum WebSocket terbuka", { size: 36, weight: 800, anchor: "middle" });
  [[L, "Browser"], [R, "Server (event upgrade)"]].forEach(([x, n]) => { b += box(x - 170, 95, 340, 64, { fill: M3, r: 16 }) + text(x, 137, n, { size: 26, weight: 800, anchor: "middle" }); });
  b += [L, R].map((x) => line(x, 159, x, 640, { sw: 3, dash: "3 12" })).join("");
  const msg = (y, x1, x2, n, top, bot, dash) => {
    const dir = x2 > x1 ? 1 : -1;
    return arrow(x1 + dir * 8, y, x2 - dir * 12, y, { dash }) + num(330, y - 30, n) + text(358, y - 22, top, S({ weight: 700 })) + (bot ? text(600, y + 32, bot, { size: 19, weight: 500, anchor: "middle", mono: true }) : "");
  };
  b += msg(230, L, R, 1, "POST /token", "{ \"name\": \"ani\" }");
  b += msg(320, R, L, 2, "token bertanda tangan HMAC, berlaku 1 jam", "", "10 8");
  b += msg(420, L, R, 3, "GET /ws?token=...  Upgrade: websocket", "header Origin ikut terkirim");
  b += box(R - 220, 470, 440, 60, { fill: M1, r: 12, sw: 3 }) + text(R, 508, "verifyToken + cek Origin", { size: 21, weight: 700, anchor: "middle", mono: true });
  b += box(60, 560, 520, 110, { r: 14, sw: 3 }) + text(80, 598, "Sah: 101 Switching Protocols", S({ weight: 800 })) + text(80, 632, "handleUpgrade, koneksi WebSocket terbuka", S({ size: 20 }));
  b += box(620, 560, 520, 110, { fill: M1, r: 14, sw: 3 }) + text(640, 598, "Tidak sah: 401 Unauthorized", S({ weight: 800 })) + text(640, 632, "socket.destroy(), tanpa WebSocket", S({ size: 20 }));
  b += arrow(R - 130, 534, 380, 554) + arrow(R, 534, R, 554);
  b += note(720, "Browser tidak bisa memasang header Authorization di WebSocket, jadi token lewat query string.");
  b += note(754, "Token bisa tercatat di log akses, karena itu umurnya pendek.");
  return frame("Alur autentikasi WebSocket: ambil token lewat POST /token, kirim saat request upgrade, server menjawab 101 bila sah atau 401 lalu menutup socket", 790, b, AH);
}

function backoff() {
  let b = text(600, 62, "Reconnect: jeda naik dua kali lipat, diacak 50 sampai 100 persen", { size: 34, weight: 800, anchor: "middle" });
  const X0 = 250, PX = 25; // 25 px per detik, sumbu 0 sampai 30 detik
  const tick = (s) => X0 + s * PX;
  for (const s of [0, 5, 10, 15, 20, 25, 30]) b += line(tick(s), 120, tick(s), 640, { sw: 1.5, dash: "4 8" }) + text(tick(s), 672, `${s} s`, S({ anchor: "middle", size: 20 }));
  for (let n = 0; n < 8; n++) {
    const max = Math.min(30, 0.5 * 2 ** n), min = max / 2, y = 130 + n * 63;
    b += text(60, y + 32, `percobaan ${n + 1}`, S({ weight: 700, size: 21 }));
    b += box(tick(min), y + 8, Math.max(8, (max - min) * PX), 36, { fill: M3, r: 8, sw: 3 });
    b += `<rect x="${tick(max) + 8}" y="${y + 12}" width="${String(min).length * 11 + String(max).length * 11 + 50}" height="28" fill="#ffffff"/>` + text(tick(max) + 14, y + 33, `${min} - ${max} s`, S({ size: 20 }));
  }
  b += text(600, 720, "Math.min(30_000, 500 * 2 ** attempt) * (0.5 + Math.random() / 2)", { size: 21, weight: 600, anchor: "middle", mono: true });
  b += note(762, "Tanpa acakan, 1000 klien yang putus bersamaan akan menyerbu server di milidetik yang sama.");
  b += note(796, "Setelah tersambung: join dengan after = id terakhir, outbox dikirim ulang dengan cid sama.");
  return frame("Grafik jeda reconnect klien chat: percobaan 1 sampai 8 dengan jeda maksimum 0,5, 1, 2, 4, 8, 16, 30, 30 detik dan rentang acak setengah sampai penuh", 830, b);
}

const DIAGRAMS = { "arsitektur-chat": arsitektur, "autentikasi-upgrade": upgrade, "reconnect-backoff": backoff };
mkdirSync("public/studio/aplikasi-chat-realtime", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/aplikasi-chat-realtime/${name}.svg`, draw());
  console.log(name);
}
