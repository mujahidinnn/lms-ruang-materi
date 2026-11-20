// Firewall filter + NAT RouterOS sederhana. Murni, tanpa DOM.
export type Chain = "input" | "forward" | "output";
export type State = "established,related" | "new" | "invalid";
export type Rule = { chain: Chain; aksi: "accept" | "drop"; state?: State; masuk?: "ether1" | "ether2"; src?: string; dport?: number };
export type Addr = { ip: string; port: number | null };
export type Paket = { id: string; label: string; asal: "luar" | "lan" | "router"; masuk?: "ether1" | "ether2"; state: State; proto: "tcp" | "icmp"; src: Addr; dst: Addr };
export type Nat = { masq: boolean; dstnat: boolean };
export type Tahap = { label: string; detail: string; status: "lewat" | "berhenti" | "lewati" };

export const WAN = "203.0.113.2", LAN_IP = "192.168.88.1", LAPTOP = "192.168.88.10", SERVER = "192.168.88.10";
const adaLan = (ip: string) => ip.startsWith("192.168.88.");

export const PAKET: Paket[] = [
  { id: "web", label: "laptop buka web", asal: "lan", masuk: "ether2", state: "new", proto: "tcp", src: { ip: LAPTOP, port: 51000 }, dst: { ip: "198.51.100.20", port: 443 } },
  { id: "balasan", label: "balasan web", asal: "luar", masuk: "ether1", state: "established,related", proto: "tcp", src: { ip: "198.51.100.20", port: 443 }, dst: { ip: WAN, port: 51000 } },
  { id: "winbox-luar", label: "Winbox dari internet", asal: "luar", masuk: "ether1", state: "new", proto: "tcp", src: { ip: "198.51.100.7", port: 40000 }, dst: { ip: WAN, port: 8291 } },
  { id: "winbox-lan", label: "Winbox dari LAN", asal: "lan", masuk: "ether2", state: "new", proto: "tcp", src: { ip: LAPTOP, port: 52000 }, dst: { ip: LAN_IP, port: 8291 } },
  { id: "web-luar", label: "internet ke web server", asal: "luar", masuk: "ether1", state: "new", proto: "tcp", src: { ip: "198.51.100.7", port: 41000 }, dst: { ip: WAN, port: 80 } },
  { id: "diblokir", label: "klien .50 buka web", asal: "lan", masuk: "ether2", state: "new", proto: "tcp", src: { ip: "192.168.88.50", port: 53000 }, dst: { ip: "198.51.100.20", port: 443 } },
  { id: "ping", label: "router ping 8.8.8.8", asal: "router", state: "new", proto: "icmp", src: { ip: WAN, port: null }, dst: { ip: "8.8.8.8", port: null } },
];

export const TEMPLATE: Rule[] = [
  { chain: "input", aksi: "accept", state: "established,related" },
  { chain: "input", aksi: "drop", state: "invalid" },
  { chain: "input", aksi: "accept", masuk: "ether2" },
  { chain: "input", aksi: "drop", masuk: "ether1" },
  { chain: "input", aksi: "accept", src: "192.168.88.0/24", dport: 8291 },
  { chain: "forward", aksi: "accept", state: "established,related" },
  { chain: "forward", aksi: "drop", state: "invalid" },
  { chain: "forward", aksi: "accept", masuk: "ether2" },
  { chain: "forward", aksi: "drop", masuk: "ether1" },
  { chain: "forward", aksi: "drop", src: "192.168.88.50" },
  { chain: "forward", aksi: "accept", masuk: "ether1", dport: 80 },
];
export const DEFAULT_RULES = [0, 2, 3, 5, 8].map((i) => TEMPLATE[i]);

export const teksAturan = (r: Rule) =>
  [`chain=${r.chain}`, `action=${r.aksi}`, r.state && `connection-state=${r.state}`, r.masuk && `in-interface=${r.masuk}`, r.src && `src-address=${r.src}`, r.dport && `dst-port=${r.dport}`].filter(Boolean).join(" ");

const cocokSrc = (pola: string, ip: string) => (pola.endsWith("/24") ? ip.startsWith(pola.slice(0, pola.lastIndexOf(".") + 1)) : pola === ip);
const fmt = (a: Addr) => (a.port === null ? a.ip : `${a.ip}:${a.port}`);
export const fmtAddr = fmt;

export function proses(p: Paket, rules: Rule[], o: Nat) {
  const catatan: string[] = [];
  let dst = p.dst, src = p.src, state = p.state;
  let dstBerubah = false;

  // dstnat dan pembalikan koneksi terjadi sebelum keputusan routing
  if (p.asal !== "router") {
    if (o.dstnat && p.masuk === "ether1" && state === "new" && dst.ip === WAN && dst.port === 80) {
      dst = { ip: SERVER, port: 80 }; dstBerubah = true;
      catatan.push(`dst-nat: tujuan ${fmt(p.dst)} dialihkan ke ${fmt(dst)}.`);
    } else if (p.id === "balasan") {
      if (o.masq) { dst = { ip: LAPTOP, port: dst.port }; dstBerubah = true; catatan.push("tabel koneksi membalik masquerade: tujuan kembali ke laptop."); }
      else { state = "invalid"; catatan.push("tanpa masquerade tidak ada koneksi yang dicatat: paket ini tidak cocok dengan koneksi mana pun (invalid)."); }
    }
  }

  const chain: Chain = p.asal === "router" ? "output" : dst.ip === WAN || dst.ip === LAN_IP ? "input" : "forward";
  const keluar = adaLan(dst.ip) ? "ether2" : "ether1";
  const cocok = rules.findIndex((r) => r.chain === chain && (!r.state || r.state === state) && (!r.masuk || r.masuk === p.masuk) && (!r.src || cocokSrc(r.src, src.ip)) && (!r.dport || r.dport === dst.port));
  const dibuang = cocok >= 0 && rules[cocok].aksi === "drop";

  let srcBerubah = false;
  if (!dibuang && chain !== "input" && keluar === "ether1") {
    if (adaLan(src.ip) && o.masq) { src = { ip: WAN, port: src.port }; srcBerubah = true; catatan.push(`masquerade: sumber diganti jadi alamat WAN ${WAN}.`); }
    else if (adaLan(src.ip)) catatan.push("masquerade mati: alamat privat keluar ke internet dan balasannya tidak akan kembali.");
    else catatan.push("sumber sudah alamat WAN, tidak ada yang perlu diubah.");
  }

  const nTahap = (label: string, detail: string): Tahap => ({ label, detail, status: "lewat" });
  const jalur: Tahap[] = p.asal === "router"
    ? [nTahap("router", "asal paket"), nTahap("output", ""), nTahap("srcnat", ""), nTahap("keluar", "ether1")]
    : [nTahap("masuk", p.masuk === "ether1" ? "ether1 WAN" : "ether2 LAN"), nTahap("dstnat", dstBerubah ? "dst diubah" : "tidak diubah"), nTahap(chain, ""),
      ...(chain === "input" ? [nTahap("router", "diproses lokal")] : [nTahap("srcnat", srcBerubah ? "src diubah" : "tidak diubah"), nTahap("keluar", keluar)])];
  const ic = jalur.findIndex((t) => t.label === chain);
  jalur[ic].detail = cocok >= 0 ? `aturan ${cocok + 1}` : "tak ada cocok";
  if (dibuang) jalur.forEach((t, i) => { if (i === ic) t.status = "berhenti"; else if (i > ic) t.status = "lewati"; });
  if (p.asal === "router") jalur[2].detail = srcBerubah ? "src diubah" : "tidak diubah";

  const hasil = dibuang ? "dibuang" : "diterima";
  const ringkas = cocok >= 0
    ? `${hasil === "dibuang" ? "Dibuang" : "Diterima"} oleh aturan ${cocok + 1} di chain ${chain}: ${teksAturan(rules[cocok])}.`
    : `Diterima di chain ${chain}: tidak ada aturan yang cocok, dan RouterOS menerima paket bila tidak ada yang menolaknya.`;
  return { chain, jalur, cocok: cocok >= 0 ? cocok : null, hasil, ringkas, sebelum: { src: p.src, dst: p.dst }, sesudah: { src, dst }, catatan };
}
