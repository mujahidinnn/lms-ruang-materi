// Diagrams for Studio Proyek "platform-saas-multi-tenant", same look as scripts/praktik.mjs.
//   node scripts/studio-diagrams/platform-saas-multi-tenant.mjs
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

const PINK = "#f4b6c2", GREY = "#f1f1ee";
const dashBox = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="none" stroke="${INK}" stroke-width="3" stroke-dasharray="12 9"/>`;
const code = (x, y, arr, o = {}) => arr.map((l, i) => text(x, y + i * 28, l, M({ size: 18, ...o }))).join("");
const para = (x, y, arr, o = {}) => arr.map((l, i) => text(x, y + i * 28, l, S({ size: 19, ...o }))).join("");

function rlsIsolasi() {
  let b = text(600, 56, "RLS: database yang menyaring, bukan aplikasi yang ingat", { size: 32, weight: 800, anchor: "middle" });
  b += box(40, 96, 560, 330, { r: 16 }) + text(64, 134, "withTenant(u1, orgA)  sebagai app_user", S({ size: 21, weight: 800 }));
  b += code(64, 174, ["begin", "set_config('app.user_id', 'u1', true)", "cek memberships: u1 anggota A?", "set_config('app.org_id', 'A', true)", "select * from bookings", "  where org_id = 'B'  -- iseng/lupa", "commit  -- setting ikut hilang"]);
  b += arrow(604, 260, 650, 260);
  b += box(656, 96, 504, 110, { fill: M1, r: 16 }) + text(680, 134, "policy tenant  (to app_user)", S({ size: 21, weight: 800 }));
  b += text(680, 170, "using (org_id = app.current_org())", M({ size: 18, weight: 700 })) + text(680, 194, "with check (sama, untuk insert/update)", M({ size: 16 }));
  b += text(680, 240, "bookings", M({ size: 19, weight: 800 }));
  const rows = [["1", "A", "Rina, 09.00", true], ["2", "B", "Doni, 10.00", false], ["3", "A", "Sari, 13.00", true], ["4", "B", "Agus, 15.00", false]];
  rows.forEach(([id, org, nm, ok], i) => {
    const y = 252 + i * 44;
    b += `<rect x="656" y="${y}" width="504" height="38" rx="8" fill="${ok ? M3 : GREY}" stroke="${INK}" stroke-width="2"${ok ? "" : ' stroke-dasharray="6 6"'}/>`;
    b += text(676, y + 26, id, M({ size: 17 })) + text(720, y + 26, `org ${org}`, M({ size: 17, weight: 700 })) + text(840, y + 26, nm, S({ size: 17 }));
    b += text(1144, y + 26, ok ? "terlihat" : "tak ada bagi A", S({ size: 17, weight: 700, anchor: "end" }));
  });
  b += box(40, 450, 1120, 80, { r: 14, sw: 3 });
  b += text(64, 486, "Hasil: 0 baris. Policy menyisakan baris org A dulu, lalu where org_id = 'B' tidak cocok dengan apa pun.", S({ size: 19, weight: 700 }));
  b += text(64, 514, "Tanpa set_config: current_org() bernilai null, jadi nol baris. Bukan error, bukan semua baris.", S({ size: 19 }));
  // roles
  b += text(40, 584, "Empat role koneksi", S({ size: 24, weight: 800 }));
  const role = (x, t, l1, l2, l3, fill) => box(x, 604, 265, 170, { fill, r: 16 }) + text(x + 20, 642, t, M({ size: 20, weight: 800 })) + para(x + 20, 680, [l1, l2, l3], { size: 18 });
  b += role(40, "pemilik", "DATABASE_URL", "migrasi saja; pemilik", "tabel melewati RLS", PINK);
  b += role(325, "app_user", "request web", "policy tenant +", "hak minimum", M3);
  b += role(610, "app_system", "webhook, worker", "policy system", "using (true), eksplisit", M1);
  b += role(895, "app_auth", "Better Auth", "hanya tabel auth,", "tanpa data tenant", "#ffffff");
  b += note(818, "Satu transaksi, satu tenant: set_config(..., true) aman di pooler mode transaksi.");
  return frame("Row Level Security: transaksi app_user memasang app.org_id A, policy tenant menyaring baris bookings ke org A sehingga query untuk org B mengembalikan nol baris; empat role koneksi dan tugasnya", 850, b, AH);
}

function webhookIdempoten() {
  let b = text(600, 56, "Webhook Midtrans: aman dikirim ulang, aman tidak berurutan", { size: 32, weight: 800, anchor: "middle" });
  const st = (y, n, t, sub) => box(60, y, 600, 84, { r: 14 }) + circle(94, y + 42, 20, { fill: M3, sw: 3 }) + text(94, y + 50, n, { size: 20, weight: 800, anchor: "middle" }) + text(130, y + 36, t, S({ size: 20, weight: 800 })) + text(130, y + 66, sub, M({ size: 16 }));
  const out = (y, t, fill) => box(760, y + 12, 400, 60, { fill, r: 12, sw: 3 }) + text(780, y + 50, t, S({ size: 18, weight: 700 })) + arrow(664, y + 42, 754, y + 42);
  const ys = [100, 210, 340, 450, 560];
  b += st(ys[0], 1, "Cek tanda tangan", "SHA512(order_id+status_code+gross+key)") + out(ys[0], "salah: 401, berhenti", PINK);
  b += st(ys[1], 2, "Ambil status dari API Midtrans", "isi notifikasi hanya pemicu") + out(ys[1], "API gagal: 500, Midtrans kirim ulang", PINK);
  b += st(ys[2], 3, "Catat webhook_events", "insert (order_id:status) on conflict do nothing") + out(ys[2], "sudah ada: duplikat, 200", GREY);
  b += st(ys[3], 4, "billing_orders: pending -> paid", "where status <> 'paid' and gross_amount cocok") + out(ys[3], "tidak kena: diabaikan, 200", GREY);
  b += st(ys[4], 5, "Perpanjang langganan", "plan_id, paid_until + 1 bulan, audit_log") + out(ys[4], "dibayar, 200", M3);
  for (let i = 0; i < 4; i++) b += arrow(360, ys[i] + 88, 360, ys[i + 1] - 6);
  b += dashBox(40, 326, 640, 330) + text(48, 680, "langkah 3 sampai 5: satu transaksi app_system", S({ size: 18, weight: 800 }));
  // example
  b += text(40, 740, "Tiga notifikasi untuk order sub-org1-202611", S({ size: 22, weight: 800 }));
  const ex = [["settlement", "event baru, order pending -> paid, paid_until +1 bulan", M3], ["settlement (dikirim ulang)", "event sudah ada: duplikat, tidak ada yang berubah", GREY], ["expire (terlambat datang)", "event baru, tapi gagal hanya mengubah order pending: tetap paid", GREY]];
  ex.forEach(([a, r, fill], i) => {
    const y = 760 + i * 56;
    b += box(40, y, 1120, 48, { fill, r: 10, sw: 2 }) + text(60, y + 32, `#${i + 1}  ${a}`, M({ size: 17, weight: 700 })) + text(420, y + 32, r, S({ size: 18 }));
  });
  b += note(966, "Hasil akhirnya sama, berapa kali pun dan dalam urutan apa pun notifikasi datang.");
  return frame("Alur handler webhook Midtrans: cek tanda tangan, ambil status dari API, catat webhook_events dengan on conflict do nothing, ubah order pending ke paid sekali, perpanjang langganan; contoh tiga notifikasi dengan hasilnya", 1000, b, AH);
}

function antreanSkipLocked() {
  let b = text(600, 56, "Antrean job di Postgres: FOR UPDATE SKIP LOCKED", { size: 32, weight: 800, anchor: "middle" });
  const cols = [440, 480, 670, 780, 930];
  b += ["id", "kind", "run_at", "locked_until", "keadaan"].map((h, i) => text(cols[i], 116, h, S({ size: 19, weight: 800 }))).join("") + line(420, 128, 1160, 128, { sw: 3 });
  const rows = [
    ["1", "booking.reminder", "lewat", "+5 mnt", "dikunci Worker A", M3, false],
    ["2", "booking.reminder", "lewat", "+5 mnt", "dikunci Worker B", M3, false],
    ["3", "booking.reminder", "besok", "-", "belum waktunya", "#ffffff", false],
    ["4", "billing.check", "lewat", "kedaluwarsa", "worker mati: siap lagi", M1, false],
    ["5", "booking.reminder", "lewat", "-", "selesai (done_at)", GREY, true],
  ];
  rows.forEach(([id, k, run, lk, st, fill, done], i) => {
    const y = 142 + i * 58;
    b += `<rect x="420" y="${y}" width="740" height="50" rx="10" fill="${fill}" stroke="${INK}" stroke-width="2"${done ? ' stroke-dasharray="6 6"' : ""}/>`;
    [id, k, run, lk].forEach((c, j) => (b += text(cols[j], y + 33, c, M({ size: 16 }))));
    b += text(cols[4], y + 33, st, S({ size: 16, weight: 700 }));
  });
  b += box(60, 144, 230, 46, { fill: "#ffffff", r: 12 }) + text(175, 176, "Worker A", { size: 24, weight: 800, anchor: "middle" }) + arrow(294, 167, 414, 167);
  b += box(60, 202, 230, 46, { fill: "#ffffff", r: 12 }) + text(175, 234, "Worker B", { size: 24, weight: 800, anchor: "middle" }) + arrow(294, 225, 414, 225);
  b += text(60, 300, "Baris 1 sudah dikunci A.", S({ size: 18, weight: 700 })) + text(60, 326, "B tidak menunggu: SKIP LOCKED", S({ size: 18 })) + text(60, 352, "melompat ke baris berikutnya.", S({ size: 18 }));
  b += box(40, 450, 1120, 104, { r: 14, sw: 3 });
  b += code(64, 486, ["update jobs set attempts = attempts + 1, locked_until = now() + '5 min'", "where id = (select id ... order by run_at limit 1 for update skip locked)"]);
  // retry
  b += text(40, 610, "Kalau handler gagal: run_at mundur eksponensial", S({ size: 22, weight: 800 }));
  const xs = [110, 330, 550, 770, 990];
  xs.forEach((x, i) => {
    b += circle(x, 680, 34, { fill: i === 4 ? PINK : M1 }) + text(x, 688, i + 1, { size: 24, weight: 800, anchor: "middle" });
    if (i < 4) b += arrow(x + 38, 680, xs[i + 1] - 40, 680) + text((x + xs[i + 1]) / 2, 664, ["1 mnt", "2 mnt", "4 mnt", "8 mnt"][i], S({ size: 18, weight: 800, anchor: "middle" }));
  });
  b += text(110, 742, "percobaan", S({ size: 17, anchor: "middle" })) + text(990, 742, "max_attempts", S({ size: 17, anchor: "middle" })) + text(1050, 690, "-> menyerah,", S({ size: 17, weight: 700 })) + text(1050, 714, "cek manual", S({ size: 17, weight: 700 }));
  b += box(40, 772, 1120, 112, { r: 14, sw: 3 });
  b += text(64, 808, "Job dimasukkan di transaksi yang sama dengan booking: booking batal, job ikut batal.", S({ size: 19 }));
  b += text(64, 840, "dedupe_key unik: satu booking satu pengingat. Idempotency-Key di Resend: retry tidak membuat email dobel.", S({ size: 19 }));
  b += text(64, 870, "locked_until 5 menit: job milik worker yang mati diambil lagi setelahnya.", S({ size: 19 }));
  return frame("Dua worker mengambil job berbeda dengan FOR UPDATE SKIP LOCKED; job yang belum waktunya, kedaluwarsa kuncinya, dan selesai; jeda retry 1, 2, 4, 8 menit sampai max_attempts", 910, b, AH);
}

function expandContract() {
  let b = text(600, 56, "Expand/contract: ganti nama kolom tanpa mematikan aplikasi", { size: 32, weight: 800, anchor: "middle" });
  const chip = (x, y, s, fill, dash) => `<rect x="${x}" y="${y}" width="150" height="44" rx="10" fill="${fill}" stroke="${INK}" stroke-width="3"${dash ? ' stroke-dasharray="8 6"' : ""}/>` + text(x + 75, y + 29, s, M({ size: 16, weight: 700, anchor: "middle" }));
  const col = (x, head, fill, chips, kode, langkah) => {
    let s = box(x, 96, 360, 600, { r: 18 }) + `<rect x="${x}" y="96" width="360" height="60" rx="18" fill="${fill}" stroke="${INK}" stroke-width="4"/>`;
    s += text(x + 180, 136, head, S({ size: 22, weight: 800, anchor: "middle" }));
    s += text(x + 24, 190, "bookings", M({ size: 18, weight: 800 }));
    s += chips;
    s += text(x + 24, 312, "Migrasi", S({ size: 19, weight: 800 })) + para(x + 24, 340, langkah, { size: 17 });
    s += line(x + 20, 560, x + 340, 560, { sw: 2 });
    return s + text(x + 24, 592, "Kode yang berjalan", S({ size: 19, weight: 800 })) + para(x + 24, 622, kode, { size: 17 });
  };
  b += col(40, "Rilis N: Expand", M1,
    chip(64, 206, "client_email", "#ffffff") + chip(234, 206, "contact_email", M3, true) + text(214, 268, "trigger sinkron dua arah", S({ size: 16, weight: 700, anchor: "middle" })),
    ["v lama: client_email", "v N: client_email", "trigger mengisi kolom baru"],
    ["tambah kolom (nullable)", "trigger sinkron dua arah", "backfill per 5.000 baris,", "  commit tiap batch", "CHECK ... NOT VALID,", "  lalu VALIDATE", "indeks CONCURRENTLY", "lock_timeout 5s"]);
  b += col(420, "Rilis N+1: Pindah", M3,
    chip(444, 206, "client_email", "#ffffff") + chip(614, 206, "contact_email", M3) + text(594, 268, "keduanya masih tersinkron", S({ size: 16, weight: 700, anchor: "middle" })),
    ["v N dan v N+1 sempat", "berjalan bersamaan;", "trigger menjaga keduanya benar"],
    ["tidak ada migrasi", "", "kode membaca dan menulis", "contact_email"]);
  b += col(800, "Rilis N+2: Contract", PINK,
    chip(824, 206, "client_email", GREY, true) + chip(994, 206, "contact_email", M3) + text(974, 268, "kolom lama dihapus", S({ size: 16, weight: 700, anchor: "middle" })),
    ["hanya kode yang memakai", "contact_email"],
    ["SET NOT NULL (pakai CHECK", "  yang sudah valid, tanpa", "  scan ulang)", "hapus CHECK, trigger,", "  dan client_email", "baru setelah tidak ada kode", "  yang menyentuh kolom lama"]);
  b += arrow(404, 400, 416, 400) + arrow(784, 400, 796, 400);
  b += note(744, "Setiap migrasi harus cocok dengan dua versi kode yang sempat berjalan bersamaan saat deploy.");
  b += note(778, "Tiga pull request terpisah. Rollback aman di N dan N+1; setelah contract, kolom lama sudah hilang.");
  return frame("Tiga rilis expand, pindah, contract untuk mengganti client_email menjadi contact_email: tambah kolom dan trigger sinkron, kode pindah ke kolom baru, lalu kolom lama dihapus", 810, b, AH);
}

const DIAGRAMS = { "rls-isolasi": rlsIsolasi, "webhook-idempoten": webhookIdempoten, "antrean-skip-locked": antreanSkipLocked, "expand-contract": expandContract };
mkdirSync("public/studio/platform-saas-multi-tenant", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/platform-saas-multi-tenant/${name}.svg`, draw());
  console.log(name);
}
