// Diagrams for Studio Proyek "toko-online-laravel", same look as scripts/praktik.mjs.
//   node scripts/studio-diagrams/toko-online-laravel.mjs
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

const OUT = "public/studio/toko-online-laravel";

function alurBelanja() {
  let b = text(600, 62, "Alur belanja di Toko Sore", { size: 40, weight: 800, anchor: "middle" });
  const top = [["Katalog", ["cari, filter, halaman"]], ["Detail produk", ["/produk/{slug}"]], ["Keranjang", ["session: id => jumlah"]]];
  top.forEach(([t, l], i) => {
    const x = 210 + i * 390;
    b += node(x, 110, 320, 120, t, l, i === 2 ? M1 : "#ffffff", i === 1);
    if (i < 2) b += arrow(x + 162, 170, x + 226, 170);
  });
  b += box(40, 270, 1120, 46, { fill: "#ffffff", r: 12, sw: 3 }) + text(600, 301, "Tamu boleh sampai sini, tanpa akun", S({ anchor: "middle", weight: 700 }));
  b += arrow(990, 232, 990, 372);
  b += node(990, 380, 320, 120, "Login / daftar", ["Breeze, middleware auth"], M3);
  b += arrow(828, 440, 772, 440);
  b += node(600, 380, 320, 120, "Checkout", ["alamat pengiriman"], "#ffffff");
  b += arrow(438, 440, 382, 440);
  b += node(210, 380, 320, 120, "Pesanan #id", ["hanya pemiliknya"], M1);
  // transaction band
  b += box(40, 540, 1120, 200, { fill: M1, r: 18 });
  b += text(70, 584, "Di dalam satu transaksi saat tombol Buat pesanan ditekan", { size: 26, weight: 800 });
  const tx = ["kunci baris produk", "cek stok tiap item", "kurangi stok", "simpan order + items"];
  tx.forEach((t, i) => {
    const x = 70 + i * 272;
    b += box(x, 610, 240, 70, { r: 12, sw: 3 }) + text(x + 120, 653, t, S({ anchor: "middle", weight: 700 }));
    if (i < 3) b += arrow(x + 244, 645, x + 268, 645);
  });
  b += text(600, 720, "Satu saja gagal: semuanya dibatalkan (rollback)", S({ anchor: "middle", weight: 700 }));
  b += line(600, 502, 600, 538, { dash: "8 8" });
  b += note(790, "Admin punya jalur sendiri: /admin/products, dijaga Gate admin.");
  return frame("Alur belanja: katalog, detail, keranjang tanpa login, lalu login, checkout dalam satu transaksi, dan halaman pesanan", 830, b, AH);
}

function erd() {
  let b = text(600, 62, "Tabel dan relasi toko", { size: 40, weight: 800, anchor: "middle" });
  const W = 330;
  const table = (x, y, name, cols, fill = "#ffffff") => {
    let s = box(x, y, W, 70 + cols.length * 34, { fill, r: 14 }) + text(x + 20, y + 38, name, { size: 26, weight: 800, mono: true });
    s += line(x, y + 54, x + W, y + 54, { sw: 3 });
    cols.forEach(([c, t], i) => { s += text(x + 20, y + 88 + i * 34, c, { size: 21, weight: 700, mono: true }) + text(x + W - 20, y + 88 + i * 34, t, S({ size: 19, anchor: "end" })); });
    return s;
  };
  const one = (x, y) => text(x, y, "1", { size: 24, weight: 800, anchor: "middle" });
  const many = (x, y) => text(x, y, "n", { size: 24, weight: 800, anchor: "middle" });
  b += table(40, 100, "users", [["id", "PK"], ["name, email", ""], ["password", ""], ["is_admin", "boolean"]]);
  b += table(830, 100, "orders", [["id", "PK"], ["user_id", "FK cascade"], ["status", "'baru'"], ["total", "rupiah"], ["shipping_*", "nama, HP, alamat"]], M1);
  b += table(40, 460, "categories", [["id", "PK"], ["name", ""], ["slug", "unik"]]);
  b += table(435, 460, "products", [["id", "PK"], ["category_id", "FK restrict"], ["name, slug", "slug unik"], ["description", ""], ["price", "rupiah"], ["stock", "integer"], ["image", "path / null"]], M1);
  b += table(830, 460, "order_items", [["id", "PK"], ["order_id", "FK cascade"], ["product_id", "FK restrict"], ["product_name", "salinan"], ["price", "salinan"], ["quantity", ""]], M3);
  b += arrow(372, 190, 824, 190) + one(392, 178) + many(806, 178) + text(598, 178, "user punya banyak orders", S({ anchor: "middle", weight: 700 }));
  b += arrow(995, 346, 995, 454) + one(1014, 374) + many(1014, 446);
  b += text(975, 408, "order punya banyak items", S({ anchor: "end", weight: 700 }));
  b += arrow(372, 530, 429, 530) + one(386, 518) + many(415, 518);
  b += arrow(767, 530, 824, 530) + one(781, 518) + many(810, 518);
  b += box(40, 680, 330, 120, { r: 14, sw: 3 });
  b += text(60, 718, "Cara membaca panah:", S({ weight: 800 }));
  b += text(60, 752, "1 baris di pangkal punya", S());
  b += text(60, 782, "n baris di ujung panah", S());
  b += note(850, "order_items menyalin nama dan harga, supaya pesanan lama tidak ikut berubah saat harga naik.");
  return frame("Diagram relasi: users memiliki orders, orders memiliki order_items, categories memiliki products, products muncul di banyak order_items yang menyalin nama serta harga", 890, b, AH);
}

function checkout() {
  let b = text(600, 62, "Checkout dalam satu transaksi", { size: 40, weight: 800, anchor: "middle" });
  const steps = [
    ["BEGIN", "DB::transaction(function () { ... })"],
    ["SELECT ... FOR UPDATE", "lockForUpdate(): baris produk dikunci"],
    ["INSERT orders", "total sementara 0"],
    ["untuk tiap item:", "stok cukup? decrement + INSERT order_items"],
    ["UPDATE orders SET total", "jumlah dari harga x kuantitas"],
    ["COMMIT", "kunci dilepas, lalu keranjang dikosongkan"],
  ];
  steps.forEach(([a, c], i) => {
    const y = 110 + i * 92;
    b += box(60, y, 700, 72, { fill: i === 0 || i === 5 ? M3 : "#ffffff", r: 14, sw: 3 });
    b += text(84, y + 32, a, { size: 22, weight: 800, mono: true }) + text(84, y + 60, c, S({ size: 19 }));
    if (i < 5) b += arrow(410, y + 74, 410, y + 88);
  });
  b += box(820, 380, 330, 170, { fill: M1, r: 16 });
  b += text(985, 420, "Stok kurang?", { size: 26, weight: 800, anchor: "middle" });
  b += text(985, 456, "throw ValidationException", S({ anchor: "middle", mono: true, size: 19 }));
  b += text(985, 490, "ROLLBACK semua", S({ anchor: "middle", weight: 700 }));
  b += text(985, 522, "stok kembali utuh", S({ anchor: "middle" }));
  b += arrow(762, 412, 814, 440, { dash: "10 8" });
  b += box(820, 120, 330, 200, { r: 16, sw: 3 });
  b += text(985, 160, "Pembeli kedua", { size: 24, weight: 800, anchor: "middle" });
  b += text(985, 196, "membeli produk yang sama", S({ anchor: "middle" }));
  b += text(985, 226, "di saat bersamaan:", S({ anchor: "middle" }));
  b += text(985, 256, "MENUNGGU sampai selesai,", S({ anchor: "middle", weight: 800 }));
  b += text(985, 286, "lalu membaca stok terbaru", S({ anchor: "middle" }));
  b += arrow(814, 220, 764, 236, { dash: "10 8" });
  b += note(700, "Harga diambil dari tabel products di dalam transaksi, bukan dari form atau session.");
  return frame("Urutan checkout: begin, kunci baris produk, buat order, cek dan kurangi stok tiap item, isi total, commit; stok kurang memicu rollback, pembeli kedua menunggu kunci", 740, b, AH);
}

function deploy() {
  let b = text(600, 62, "Toko Sore di Laravel Cloud", { size: 40, weight: 800, anchor: "middle" });
  b += node(190, 110, 280, 130, "GitHub", ["git push ke main"], "#ffffff");
  b += node(600, 110, 380, 130, "Build", ["composer, npm run build,", "artisan optimize"], M1);
  b += arrow(332, 175, 404, 175);
  b += arrow(600, 242, 600, 300) + text(616, 280, "deploy: migrate --force", S({ mono: true, size: 19 }));
  b += box(330, 306, 540, 170, { fill: M3, r: 18 });
  b += text(600, 350, "App (Flex, scale to zero)", { size: 26, weight: 800, anchor: "middle" });
  b += text(600, 386, "PHP 8.5, Laravel 13", S({ anchor: "middle" }));
  b += text(600, 418, "disk aplikasi TIDAK permanen", S({ anchor: "middle", weight: 700 }));
  b += text(600, 450, "region Singapore", S({ anchor: "middle" }));
  b += node(190, 560, 300, 130, "Laravel MySQL", ["DB_* diisi otomatis"], M1);
  b += node(1010, 560, 300, 130, "Bucket (R2)", ["default disk, publik", "foto produk"], M1);
  b += arrow(420, 478, 260, 552) + arrow(780, 478, 940, 552);
  b += node(1010, 110, 300, 130, "Pembeli", ["https://NAMA.laravel.cloud"], "#ffffff", false);
  b += arrow(1010, 242, 872, 330) + text(1000, 300, "HTTPS", S({ weight: 700 }));
  b += text(1010, 728, "browser membuka foto", S({ anchor: "middle", size: 20 })) + text(1010, 756, "langsung dari URL bucket", S({ anchor: "middle", size: 20 }));
  b += note(820, "Kode tetap sama: store('products') dan Storage::url() mengikuti FILESYSTEM_DISK.", 600);
  return frame("Deploy Laravel Cloud: GitHub memicu build, app tersambung ke Laravel MySQL dan bucket object storage, pembeli datang lewat HTTPS", 860, b, AH);
}

const DIAGRAMS = { "alur-belanja": alurBelanja, "erd-toko": erd, "checkout-transaksi": checkout, "deploy-laravel-cloud": deploy };
mkdirSync(OUT, { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`${OUT}/${name}.svg`, draw());
  console.log(name);
}
