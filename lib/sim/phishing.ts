// Static email scenarios for the phishing inspector. Nothing here sends or fetches anything.
export type Part = "sender" | "subject" | "greeting" | "body" | "link" | "attachment";
export type Hotspot = { id: string; part: Part; flag: boolean; why: string };
export type Scenario = {
  id: string;
  label: string;
  fromName: string;
  fromAddr: string;
  subject: string;
  greeting: string;
  body: string;
  linkText: string;
  linkUrl: string;
  attachment: string | null;
  spots: Hotspot[];
};

export const SCENARIOS: Scenario[] = [
  {
    id: "phish",
    label: "Surel 1",
    fromName: "Bank Contoh Layanan",
    fromAddr: "layanan@bank-contoh-aman.com",
    subject: "SEGERA: Akun Anda akan diblokir dalam 2 jam",
    greeting: "Pelanggan yang terhormat,",
    body: "Kami mendeteksi aktivitas mencurigakan. Verifikasi sandi dan kode OTP Anda sekarang, atau akun dibekukan. Jangan beri tahu siapa pun.",
    linkText: "https://www.bank.co.id/verifikasi",
    linkUrl: "https://bank.co.id.login-aman.com/verifikasi",
    attachment: "formulir_verifikasi.pdf.exe",
    spots: [
      { id: "sender", part: "sender", flag: true, why: "Nama tampilan 'Bank Contoh' bisa dipasang di alamat apa pun. Domain pengirim (bank-contoh-aman.com) bukan domain resmi bank." },
      { id: "subject", part: "subject", flag: true, why: "Tekanan waktu ('segera', 2 jam) membuat kamu bertindak sebelum berpikir." },
      { id: "greeting", part: "greeting", flag: false, why: "Sapaan umum memang sering muncul di surel massal, tetapi surel sah juga banyak yang begitu. Bukan bukti sendirian." },
      { id: "body", part: "body", flag: true, why: "Lembaga yang sah tidak meminta sandi atau OTP lewat pesan, dan 'jangan beri tahu siapa pun' adalah bendera merah." },
      { id: "link", part: "link", flag: true, why: "Teks tautan tampak seperti bank.co.id, tetapi alamat aslinya mengarah ke domain utama login-aman.com. bank.co.id hanya subdomain di depannya." },
      { id: "attachment", part: "attachment", flag: true, why: "Ekstensi ganda .pdf.exe: ini program, bukan dokumen PDF." },
    ],
  },
  {
    id: "sah",
    label: "Surel 2",
    fromName: "Toko Buku Contoh",
    fromAddr: "pesanan@tokobuku.co.id",
    subject: "Pesanan #48213 sudah dikirim",
    greeting: "Halo Rina,",
    body: "Pesananmu sudah diserahkan ke kurir dan tiba sekitar 2 hari lagi. Kami tidak pernah meminta sandi lewat surel. Lacak pesanan lewat aplikasi atau situs kami.",
    linkText: "https://tokobuku.co.id/lacak",
    linkUrl: "https://tokobuku.co.id/lacak",
    attachment: null,
    spots: [
      { id: "sender", part: "sender", flag: false, why: "Alamat pengirim memakai domain toko yang sama dengan situsnya, jadi tidak ada yang janggal." },
      { id: "subject", part: "subject", flag: false, why: "Subjek informatif tanpa tekanan waktu." },
      { id: "greeting", part: "greeting", flag: false, why: "Menyebut namamu. Ini tidak menjamin sah, tetapi tidak mencurigakan." },
      { id: "body", part: "body", flag: false, why: "Tidak meminta sandi, OTP, atau tindakan terburu-buru, dan menyarankan jalur resmi." },
      { id: "link", part: "link", flag: false, why: "Teks tautan dan alamat aslinya sama, dengan domain utama tokobuku.co.id." },
    ],
  },
];

export type Result = { hits: string[]; falseAlarms: string[]; missed: string[]; score: number };

/** Score flagged spot ids: hit = flagged real red flag, false alarm = flagged innocent spot. */
export function scoreFlags(s: Scenario, flagged: Iterable<string>): Result {
  const f = new Set(flagged);
  const hits = s.spots.filter((x) => x.flag && f.has(x.id)).map((x) => x.id);
  const falseAlarms = s.spots.filter((x) => !x.flag && f.has(x.id)).map((x) => x.id);
  const missed = s.spots.filter((x) => x.flag && !f.has(x.id)).map((x) => x.id);
  const total = s.spots.filter((x) => x.flag).length;
  const score = total === 0 ? (falseAlarms.length ? 0 : 100) : Math.max(0, Math.round(((hits.length - falseAlarms.length) / total) * 100));
  return { hits, falseAlarms, missed, score };
}
