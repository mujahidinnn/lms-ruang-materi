// Diagrams for Studio Proyek "sistem-login-aman", same look as scripts/praktik.mjs.
//   node scripts/studio-diagrams/sistem-login-aman.mjs
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

function urutanMiddleware() {
  let b = text(600, 62, "Urutan app.use() di app.js menentukan siapa diperiksa apa", { size: 36, weight: 800, anchor: "middle" });
  const rows = [
    ["helmet()", "header keamanan: CSP, X-Content-Type-Options, dan lainnya", "#ffffff"],
    ['GET "/health"', "dijawab di sini, sebelum sesi: tanpa baris sesi baru", "#ffffff"],
    ["express.urlencoded", "membaca body form, maksimal 10 KB", "#ffffff"],
    ["session(...)", "cookie sid: HttpOnly, SameSite Lax, Secure di produksi", M3],
    ["csrf", "POST tanpa token yang cocok dengan sesi ditolak 403", M3],
    ["loadUser", "res.locals.user dibaca ulang dari tabel users", M3],
    ["auth, reset", "rute; pagar requireLogin dan requireRole", M1],
    ["404", "tidak ada rute yang cocok", "#ffffff"],
    ["(err, req, res, next)", "error tak dikenal: dicatat di log, pengguna melihat pesan umum", "#ffffff"],
  ];
  rows.forEach(([name, desc, fill], i) => {
    const y = 110 + i * 74;
    b += box(110, y, 1050, 60, { fill, r: 12, sw: 3 });
    b += circle(70, y + 30, 22, { fill: M1 }) + text(70, y + 39, i + 1, { size: 22, weight: 800, anchor: "middle" });
    b += text(134, y + 39, name, { size: 22, weight: 700, mono: true }) + text(460, y + 39, desc, S({ size: 21 }));
    if (i < rows.length - 1) b += line(70, y + 52, 70, y + 96, { sw: 3 });
  });
  b += note(820, "Request masuk dari atas. csrf butuh sesi, jadi harus setelah session.");
  b += note(854, "loadUser setelah csrf; auth dan reset sebelum 404. Tukar urutannya dan pagar ikut bergeser.");
  return frame("Sembilan lapisan app.js berurutan: helmet, health, urlencoded, session, csrf, loadUser, rute, 404, dan penangan error", 890, b);
}

function alurMasuk() {
  let b = text(600, 62, "POST /login: satu jalan berhasil, satu pesan gagal", { size: 38, weight: 800, anchor: "middle" });
  const X = 330, W = 520;
  const step = (y, title, sub, fill = "#ffffff") => box(X - W / 2, y, W, 92, { fill, r: 16 }) + text(X, y + 38, title, { size: 24, weight: 800, anchor: "middle", mono: true }) + text(X, y + 72, sub, S({ size: 20, anchor: "middle" }));
  b += step(110, "loginLimiter", "hanya percobaan gagal yang dihitung");
  b += step(260, "SELECT ... WHERE email = $1", "email dicari di tabel users");
  b += step(410, "argon2.verify(hash, sandi)", "email tak ada: verifikasi DUMMY_HASH");
  b += step(560, "req.session.regenerate()", "id sesi lama dibuang (session fixation)", M3);
  b += step(710, "303 ke /akun", "userId tersimpan di sesi baru", M3);
  b += arrow(X, 204, X, 254) + arrow(X, 354, X, 404) + arrow(X, 504, X, 554) + text(X + 16, 538, "cocok", S({ weight: 700 })) + arrow(X, 654, X, 704);
  const fail = (y, title, sub) => box(740, y, 420, 92, { fill: M1, r: 16 }) + text(950, y + 38, title, { size: 24, weight: 800, anchor: "middle" }) + text(950, y + 72, sub, S({ size: 20, anchor: "middle" }));
  b += fail(110, "429", "lebih dari 10 gagal dalam 15 menit");
  b += fail(410, "401", "\"Email atau kata sandi salah.\"");
  b += arrow(594, 156, 732, 156) + arrow(594, 456, 732, 456) + text(663, 440, "tidak", S({ anchor: "middle", weight: 700 }));
  b += box(740, 560, 420, 200, { r: 16, sw: 3 });
  ["Kenapa DUMMY_HASH?", "argon2 sengaja lambat. Tanpa hash", "palsu, email tak terdaftar dijawab", "lebih cepat, dan selisih waktu itu", "membocorkan email mana yang ada."].forEach((l, i) => { b += text(764, 598 + i * 34, l, S({ size: 21, weight: i ? 500 : 800 })); });
  b += note(860, "Email salah dan sandi salah mendapat pesan, status, dan waktu respons yang sama.");
  return frame("Alur POST /login: rate limit, cari email, verifikasi argon2 dengan hash palsu bila email tidak ada, regenerasi sesi, lalu redirect; gagal selalu 401 dengan pesan sama", 900, b, AH);
}

function resetToken() {
  const L = 200, C = 600, R = 1000;
  let b = text(600, 62, "Atur ulang kata sandi dengan token sekali pakai", { size: 38, weight: 800, anchor: "middle" });
  [[L, "Browser"], [C, "Server"], [R, "Database"]].forEach(([x, n]) => { b += box(x - 130, 95, 260, 64, { fill: M3, r: 16 }) + text(x, 137, n, { size: 26, weight: 800, anchor: "middle" }); });
  b += [L, C, R].map((x) => line(x, 159, x, 1000, { sw: 3, dash: "3 12" })).join("");
  const msg = (y, x1, x2, n, top, bot) => {
    const dir = x2 > x1 ? 1 : -1, cx = (x1 + x2) / 2;
    return arrow(x1 + dir * 8, y, x2 - dir * 12, y) + circle(cx - 150, y - 30, 17, { fill: M1, sw: 3 }) + text(cx - 150, y - 23, n, { size: 19, weight: 800, anchor: "middle" }) +
      text(cx - 122, y - 22, top, S({ size: 21, weight: 700 })) + (bot ? text(cx, y + 30, bot, { size: 19, weight: 500, anchor: "middle", mono: true }) : "");
  };
  const act = (x, y, w, lines) => box(x - w / 2, y, w, 22 + lines.length * 28, { fill: M1, r: 12, sw: 3 }) + lines.map((l, i) => text(x, y + 32 + i * 28, l, { size: 19, weight: 500, anchor: "middle", mono: true })).join("");
  b += msg(230, L, C, 1, "POST /lupa-sandi", "email=ani@contoh.com");
  b += act(C, 285, 330, ["token = randomBytes(32)"]);
  b += msg(410, C, R, 2, "INSERT", "sha256(token), +30 menit");
  b += msg(500, C, L, 3, "jawaban selalu sama", "terdaftar atau tidak");
  b += act(L, 555, 340, ["tautan ?token=... dikirim", "lewat email (di sini: log)"]);
  b += msg(700, L, C, 4, "POST /atur-ulang", "token + sandi baru");
  b += msg(790, C, R, 5, "DELETE ... RETURNING", "hash cocok, belum kedaluwarsa");
  b += msg(880, C, R, 6, "UPDATE, DELETE", "sandi baru, hapus semua sesi");
  b += msg(970, C, L, 7, "sandi diganti", "");
  b += note(1050, "Database hanya menyimpan hash token, bukan tokennya.");
  b += note(1084, "DELETE ... RETURNING membuat tautan hangus begitu dipakai: hanya berlaku sekali.");
  return frame("Urutan atur ulang kata sandi: token acak dibuat, hash disimpan 30 menit, tautan dikirim, lalu token dihapus saat dipakai, sandi diganti, dan semua sesi lama dihapus", 1120, b, AH);
}

const DIAGRAMS = { "urutan-middleware": urutanMiddleware, "alur-masuk": alurMasuk, "reset-token": resetToken };
mkdirSync("public/studio/sistem-login-aman", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/sistem-login-aman/${name}.svg`, draw());
  console.log(name);
}
