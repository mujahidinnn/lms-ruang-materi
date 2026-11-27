// Diagrams for Studio Proyek "sistem-pesanan-terdistribusi", same look as scripts/praktik.mjs.
//   node scripts/studio-diagrams/sistem-pesanan-terdistribusi.mjs
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

function petaKonteks() {
  let b = text(600, 62, "Peta konteks: empat layanan, satu broker, database masing-masing", { size: 34, weight: 800, anchor: "middle" });
  b += node(190, 96, 300, 100, "Pembeli", ["POST /orders"]);
  b += arrow(190, 198, 190, 236) + text(206, 224, "Idempotency-Key", S({ size: 19 }));
  // Order
  b += box(40, 240, 320, 430, { fill: M3, r: 18 }) + text(200, 282, "Order", { size: 28, weight: 800, anchor: "middle" }) + text(200, 310, "orkestrator saga", S({ anchor: "middle", size: 20 }));
  b += lines(62, 352, ["mengirim perintah", "inventory.reserve", "inventory.release", "payment.charge", "payment.refund"]);
  b += lines(62, 500, ["menerbitkan", "order.confirmed", "order.cancelled"]);
  b += box(70, 590, 260, 56, { fill: "#ffffff", r: 12, sw: 3 }) + text(200, 626, "order_db", M({ size: 20, anchor: "middle", weight: 700 }));
  // Broker
  b += box(450, 240, 300, 430, { fill: M1, r: 18 }) + text(600, 282, "RabbitMQ", { size: 28, weight: 800, anchor: "middle" }) + text(600, 312, "exchange topic flashsale", S({ anchor: "middle", size: 19 }));
  b += text(600, 380, "routing key =", S({ anchor: "middle", size: 20 })) + text(600, 408, "type.vN", M({ anchor: "middle", size: 20 }));
  b += text(600, 470, "satu antrean per", S({ anchor: "middle", size: 20 })) + text(600, 498, "layanan, plus retry", S({ anchor: "middle", size: 20 })) + text(600, 526, "dan DLQ", S({ anchor: "middle", size: 20 }));
  b += arrow(364, 400, 442, 400) + arrow(442, 470, 364, 470);
  // Right services
  const svc = (y, h, name, inn, out, db) => {
    let s = box(850, y, 310, h, { r: 18 }) + text(1005, y + 36, name, { size: 26, weight: 800, anchor: "middle" });
    s += lines(870, y + 70, ["mendengar", ...inn]);
    if (out.length) s += lines(870, y + 100 + inn.length * 26, ["menerbitkan", ...out]);
    s += text(1140, y + 36, db, M({ size: 17, anchor: "end", weight: 700 }));
    return s + arrow(758, y + h / 2, 842, y + h / 2) + (out.length ? arrow(842, y + h / 2 + 30, 758, y + h / 2 + 30) : "");
  };
  b += svc(100, 270, "Inventory", ["inventory.reserve", "inventory.release", "order.confirmed"], ["stock.reserved", "stock.rejected", "stock.released"], "");
  b += svc(390, 240, "Payment", ["payment.charge", "payment.refund"], ["payment.succeeded", "payment.failed", "payment.refunded"], "");
  b += svc(650, 140, "Notification", ["order.confirmed", "order.cancelled"], [], "");
  b += note(830, "Tiap layanan punya database sendiri dan tidak pernah membaca tabel layanan lain.");
  b += note(864, "Perintah boleh ditolak (stock.rejected). Event adalah fakta yang sudah terjadi.");
  return frame("Peta konteks sistem pesanan: layanan Order mengorkestrasi Inventory, Payment, dan Notification lewat exchange RabbitMQ, dengan perintah dan event yang didengar serta diterbitkan tiap layanan", 900, b, AH);
}

function mesinStatus() {
  let b = text(600, 62, "Mesin status pesanan dan perintah yang dikirim tiap transisi", { size: 34, weight: 800, anchor: "middle" });
  const st = (x, y, w, name, fill = "#ffffff") => box(x - w / 2, y, w, 70, { fill, r: 35 }) + text(x, y + 44, name, M({ size: 22, weight: 800, anchor: "middle" }));
  b += st(180, 130, 240, "PENDING");
  b += st(600, 130, 360, "AWAITING_PAYMENT");
  b += st(1020, 130, 250, "CONFIRMED", M3);
  b += st(600, 420, 320, "COMPENSATING");
  b += st(180, 420, 250, "CANCELLED", M1);
  const lab = (x, y, ev, cmd) => text(x, y, ev, M({ size: 19, weight: 700, anchor: "middle" })) + (cmd ? text(x, y + 26, cmd, M({ size: 18, anchor: "middle" })) : "");
  b += arrow(304, 165, 412, 165) + lab(358, 240, "stock.reserved", "-> payment.charge");
  b += arrow(784, 165, 888, 165) + lab(836, 240, "payment.succeeded", "-> order.confirmed");
  b += arrow(600, 204, 600, 412) + lab(730, 300, "payment.failed", "atau tenggat lewat") + text(730, 352, "-> inventory.release", M({ size: 18, anchor: "middle" }));
  b += arrow(432, 455, 312, 455) + lab(372, 530, "stock.released", "-> order.cancelled");
  b += arrow(180, 204, 180, 412) + lab(180, 300, "stock.rejected", "-> order.cancelled").replace(/x="180"/g, 'x="196"').replace(/text-anchor="middle"/g, 'text-anchor="start"');
  b += box(700, 510, 460, 130, { fill: M1, r: 16, sw: 3 }) + text(720, 546, "Pembayaran telat", S({ weight: 800 })) + text(720, 580, "payment.succeeded saat pesanan", S({ size: 20 })) + text(720, 610, "sudah menyerah: kirim payment.refund", S({ size: 20 }));
  b += box(40, 670, 1120, 110, { r: 16, sw: 3 });
  b += text(70, 710, "Guarded transition: semua perubahan lewat satu fungsi", S({ weight: 800 }));
  b += text(70, 748, "UPDATE orders SET status = $to WHERE id = $id AND status = $from", M({ size: 21 }));
  b += note(826, "Event ganda atau basi tidak cocok dengan status asal, jadi tidak memundurkan saga.");
  return frame("Mesin status pesanan: PENDING, AWAITING_PAYMENT, CONFIRMED, COMPENSATING, CANCELLED, dengan event pemicu dan perintah yang ditulis ke outbox di tiap transisi", 860, b, AH);
}

function outboxRelay() {
  let b = text(600, 62, "Transactional outbox: data dan pesan dalam satu transaksi", { size: 34, weight: 800, anchor: "middle" });
  b += box(40, 110, 520, 330, { fill: M1, r: 18 }) + text(300, 150, "Satu transaksi di order_db", { size: 24, weight: 800, anchor: "middle" });
  b += box(70, 175, 460, 60, { r: 12, sw: 3 }) + text(300, 213, "BEGIN", M({ size: 21, anchor: "middle", weight: 700 }));
  b += box(70, 250, 460, 60, { r: 12, sw: 3 }) + text(300, 288, "INSERT INTO orders ...", M({ size: 21, anchor: "middle" }));
  b += box(70, 325, 460, 60, { fill: M3, r: 12, sw: 3 }) + text(300, 363, "INSERT INTO outbox ...", M({ size: 21, anchor: "middle", weight: 700 }));
  b += text(300, 420, "COMMIT: keduanya ada, atau tidak sama sekali", S({ size: 20, anchor: "middle" }));
  b += box(660, 110, 500, 330, { r: 18 }) + text(910, 150, "Relay (loop terpisah)", { size: 24, weight: 800, anchor: "middle" });
  [["1", "SELECT ... FOR UPDATE"], ["", "SKIP LOCKED"], ["2", "publish ke exchange"], ["3", "waitForConfirms()"], ["4", "UPDATE outbox"], ["", "SET published_at = now()"]].forEach(([n, l], i) => { b += text(690, 200 + i * 38, n, M({ size: 20, weight: 800 })) + text(722, 200 + i * 38, l, M({ size: 20 })); });
  b += arrow(564, 290, 652, 290) + text(608, 278, "baca", S({ anchor: "middle", size: 20 }));
  b += node(910, 520, 500, 100, "RabbitMQ", ["menyimpan pesan, lalu konfirmasi"], M1);
  b += arrow(860, 446, 860, 512) + arrow(960, 512, 960, 446, { dash: "10 8" }) + text(1000, 486, "confirm", S({ size: 20 }));
  b += box(40, 500, 580, 160, { r: 16, sw: 3 });
  b += text(64, 540, "Kalau proses mati di tengah jalan:", S({ weight: 800 }));
  b += text(64, 576, "sebelum COMMIT: pesanan dan pesan sama-sama batal", S({ size: 19 }));
  b += text(64, 608, "setelah publish, sebelum UPDATE: pesan terbit lagi", S({ size: 19 }));
  b += text(64, 640, "nanti, jadi konsumen wajib idempoten", S({ size: 19 }));
  b += note(720, "Pesan bisa terkirim lebih dari sekali, tetapi tidak pernah hilang (at-least-once).");
  return frame("Transactional outbox: pesanan dan baris outbox ditulis dalam satu transaksi, lalu relay membaca dengan SKIP LOCKED, menerbitkan ke RabbitMQ, menunggu konfirmasi, dan menandai baris", 760, b, AH);
}

function retryDlq() {
  let b = text(600, 62, "Retry dengan backoff, lalu DLQ: perjalanan pesan yang selalu gagal", { size: 32, weight: 800, anchor: "middle" });
  const att = (y, n) => box(60, y, 400, 76, { fill: M3, r: 16 }) + text(260, y + 34, "antrean inventory", M({ size: 20, weight: 800, anchor: "middle" })) + text(260, y + 62, `percobaan ${n}: handler gagal`, S({ size: 20, anchor: "middle" }));
  const rq = (y, name, ttl) => box(700, y, 440, 76, { fill: M1, r: 16 }) + text(920, y + 34, name, M({ size: 20, weight: 800, anchor: "middle" })) + text(920, y + 62, ttl, S({ size: 20, anchor: "middle" }));
  const qs = [["inventory.retry.1000", "TTL 1 detik"], ["inventory.retry.5000", "TTL 5 detik"], ["inventory.retry.25000", "TTL 25 detik"]];
  for (let i = 0; i < 4; i++) {
    const y = 110 + i * 140;
    b += att(y, i + 1);
    const ry = y + 70;
    if (i < 3) {
      b += rq(ry, ...qs[i]);
      b += arrow(464, y + 38, 692, ry + 30) + text(490, y + 100, `x-attempt ${i + 1}`, S({ size: 19, weight: 700 }));
      b += arrow(696, ry + 56, 468, y + 160, { dash: "10 8" }) + text(620, ry + 96, "TTL habis", S({ size: 19 }));
    }
  }
  b += box(700, 600, 440, 76, { r: 16 }) + text(920, 634, "inventory.dlq", M({ size: 20, weight: 800, anchor: "middle" })) + text(920, 662, "x-attempt = 4, x-last-error", M({ size: 18, anchor: "middle" }));
  b += arrow(464, 568, 692, 630) + text(520, 640, "gagal ke-4 atau", S({ size: 19, weight: 700 })) + text(520, 664, "PermanentError", S({ size: 19, weight: 700 }));
  b += box(40, 720, 1120, 110, { r: 16, sw: 3 });
  b += text(64, 760, "Waktu total sebelum menyerah: 1 + 5 + 25 = sekitar 31 detik.", S({ weight: 800 }));
  b += text(64, 796, "Satu antrean per jeda, karena RabbitMQ hanya membuang pesan kedaluwarsa dari kepala antrean.", S({ size: 20 }));
  b += note(876, "Handler dipilih dari type di amplop: setelah retry, routing key berubah jadi nama antrean.");
  return frame("Topologi retry: pesan yang gagal masuk antrean retry 1 detik, 5 detik, lalu 25 detik yang mengembalikannya ke antrean utama, dan setelah gagal keempat masuk DLQ", 910, b, AH);
}

const DIAGRAMS = { "peta-konteks": petaKonteks, "mesin-status": mesinStatus, "outbox-relay": outboxRelay, "retry-dlq": retryDlq };
mkdirSync("public/studio/sistem-pesanan-terdistribusi", { recursive: true });
for (const [name, draw] of Object.entries(DIAGRAMS)) {
  writeFileSync(`public/studio/sistem-pesanan-terdistribusi/${name}.svg`, draw());
  console.log(name);
}
