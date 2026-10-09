// Turns an import_jobs.error into one sentence an admin can act on. The raw
// text stays available next to it.
export function importErrorText(error: string | null): string {
  const e = error ?? "";
  if (/\b503\b|UNAVAILABLE|high demand/i.test(e)) return "Server model sedang sibuk. Ulang beberapa menit lagi atau pilih model lain.";
  if (/\b429\b|quota|RESOURCE_EXHAUSTED/i.test(e)) return "Kuota harian model ini habis. Pilih model lain atau ulang besok.";
  if (/^SchemaError/.test(e)) return "Draf dari model tidak lengkap. Ulang atau pilih model lain.";
  if (/MAX_TOKENS|finish_reason: length/i.test(e)) return "Jawaban model terpotong karena terlalu panjang. Pilih model lain.";
  if (/SAFETY|blocked|content_filter|PROHIBITED/i.test(e)) return "Model menolak isi deck ini. Pilih model lain.";
  if (/slide count/i.test(e)) return "Jumlah slide di luar batas 1 sampai 80. Pecah deck dulu.";
  if (/\b400\b|INVALID_ARGUMENT/i.test(e)) return "Model menolak permintaan. Pilih model lain.";
  if (/\b40[13]\b/.test(e)) return "Kunci API model ditolak. Periksa secret di GitHub.";
  return "Impor gagal. Lihat detail, lalu ulang.";
}
