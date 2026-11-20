// DNS lookup dan TCP three-way handshake sebagai daftar langkah. Murni, tanpa DOM.
export type Langkah = { dari: number; ke: number; label: string; teks: string; hilang?: boolean; timeout?: boolean; k?: string; s?: string };

export const DNS_NODE = ["klien", "resolver", "root", "TLD .com", "otoritatif"] as const;
export const TCP_NODE = ["klien", "server"] as const;

export function dns(cache: boolean): Langkah[] {
  const tanya = { dari: 0, ke: 1, label: "example.com?", teks: "klien bertanya ke resolver: berapa alamat IP example.com?" };
  if (cache) return [
    tanya,
    { dari: 1, ke: 1, label: "cache hit", teks: "resolver cek cache: jawabannya ada (cache hit)." },
    { dari: 1, ke: 0, label: "203.0.113.10", teks: "resolver langsung menjawab dari cache, tanpa bertanya ke server lain." },
  ];
  return [
    tanya,
    { dari: 1, ke: 1, label: "cache kosong", teks: "resolver cek cache: tidak ada. ia harus bertanya berantai." },
    { dari: 1, ke: 2, label: "siapa .com?", teks: "resolver bertanya ke root server." },
    { dari: 2, ke: 1, label: "tanya TLD", teks: "root tidak tahu IP-nya, tapi menunjuk server TLD .com." },
    { dari: 1, ke: 3, label: "example.com?", teks: "resolver bertanya ke server TLD .com." },
    { dari: 3, ke: 1, label: "tanya otoritatif", teks: "TLD menunjuk server otoritatif example.com." },
    { dari: 1, ke: 4, label: "example.com?", teks: "resolver bertanya ke server otoritatif." },
    { dari: 4, ke: 1, label: "203.0.113.10", teks: "server otoritatif menjawab: 203.0.113.10." },
    { dari: 1, ke: 0, label: "203.0.113.10", teks: "resolver menyimpan jawaban di cache, lalu meneruskannya ke klien." },
  ];
}

export type Hilang = "tidak ada" | "SYN" | "data";

// [dari, ke, label, teks, status klien, status server] setelah paket sampai
const TCP: [number, number, string, string, string, string][] = [
  [0, 1, "SYN seq=1000", "klien membuka koneksi dan mengajukan nomor urut awalnya 1000.", "SYN-SENT", "SYN-RECEIVED"],
  [1, 0, "SYN-ACK seq=5000 ack=1001", "server setuju: nomor urutnya 5000, dan ia mengakui SYN klien (ack=1001).", "ESTABLISHED", "SYN-RECEIVED"],
  [0, 1, "ACK ack=5001", "klien mengakui SYN server. koneksi terbentuk di kedua sisi.", "ESTABLISHED", "ESTABLISHED"],
  [0, 1, "DATA seq=1001 len=100", "klien mengirim 100 byte data. byte pertama bernomor 1001.", "ESTABLISHED", "ESTABLISHED"],
  [1, 0, "ACK ack=1101", "server mengakui sampai byte 1100 dan meminta byte 1101 berikutnya.", "ESTABLISHED", "ESTABLISHED"],
  [0, 1, "FIN seq=1101", "klien selesai dan minta menutup koneksi.", "FIN-WAIT-1", "CLOSE-WAIT"],
  [1, 0, "ACK ack=1102", "server mengakui FIN klien.", "FIN-WAIT-2", "CLOSE-WAIT"],
  [1, 0, "FIN seq=5001", "server juga selesai dan minta menutup.", "TIME-WAIT", "LAST-ACK"],
  [0, 1, "ACK ack=5002", "klien mengakui FIN server. koneksi tertutup.", "TIME-WAIT", "CLOSED"],
];

export function tcp(hilang: Hilang): Langkah[] {
  const out: Langkah[] = [];
  let k = "CLOSED", s = "LISTEN";
  TCP.forEach(([dari, ke, label, teks, nk, ns], i) => {
    const kena = (hilang === "SYN" && i === 0) || (hilang === "data" && i === 3);
    if (kena) {
      if (dari === 0) k = nk; else s = ns;
      out.push({ dari, ke, label, teks: `paket ${label.split(" ")[0]} hilang di jalan. penerima tidak tahu apa-apa dan tidak membalas.`, hilang: true, k, s });
      out.push({ dari, ke: dari, label: "timeout", teks: `pengirim menunggu ACK, tapi tidak datang sampai batas waktu (timeout).`, timeout: true, k, s });
      out.push({ dari, ke, label: `${label} (ulang)`, teks: `retransmisi: pengirim mengirim ulang paket yang sama, nomor urut tidak berubah.`, k: nk, s: ns });
    } else out.push({ dari, ke, label, teks, k: nk, s: ns });
    k = nk; s = ns;
  });
  return out;
}
