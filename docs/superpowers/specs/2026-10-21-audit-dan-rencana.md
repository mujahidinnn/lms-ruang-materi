# Audit Ruang Materi dan rencana perbaikan

Tanggal: 2026-10-21. Sumber: lima analisis (produk, sistem, UI/UX, data,
software) atas kode dan data production. Status: menunggu persetujuan owner.

## Inti masalah

Ruang Materi tumbuh fitur demi fitur, tanpa satu model yang dipegang
bersama. Akibatnya:

1. **Satu hal punya banyak nama dan banyak pintu.** Kelas, materi, topik;
   roadmap vs kelas; latihan, simulasi, kuis bab, ujian, flashcard.
2. **Tiga navigasi berbeda.** Tamu melihat header publik, murid yang masuk
   dialihkan ke dasbor dengan sidebar, lalu header berganti lagi di halaman
   kelas, dan lagi di halaman bab. Di HP, tamu dapat bottom nav ikon, murid
   dapat tab atas yang terpotong. Ini yang terasa "isinya beda dan kurang
   lengkap setelah masuk".
3. **"Selesai" didefinisikan di enam tempat** dan angkanya tidak cocok:
   roadmap memakai `progress.state`, dasbor dan nilai memakai lulus ujian,
   halaman kelas memakai bab. Sertifikat macet untuk kelas tanpa ujian.
4. **Separuh katalog belum jadi kelas.** 8 dari 15 topik hanya slide (plus
   soal), dan ada topik kembar (git, github, git-dan-github,
   git-dan-gitlab; html5, html5-dan-css3, html-css-javascript).
5. **Data:** belum ada murid nyata (3 akun: 2 dev, 1 admin). Soal-soal lama
   bisa ditebak: sekitar 50% jawaban benar adalah opsi terpanjang. Bank
   ujian pas 40 soal untuk 20 per ujian, jadi percobaan ketiga mengulang.
6. **Teknis:** dua jalur tulis (sebagian island langsung ke Supabase,
   sebagian lewat /rpc), sisa Next.js, alur murid yang masuk tidak punya
   tes otomatis.

## Model yang dipakai mulai sekarang

| Istilah | Arti | Catatan |
| --- | --- | --- |
| **Kelas** | satu unit belajar (`/belajar/<slug>`, katalog `/kelas`) | "topik" dan "materi" hilang dari UI |
| **Bab** | isi kelas: bacaan + kuis bab + latihan kode, mode Baca atau Slide | |
| **Latihan ujian** | latihan soal; mode simulasi 20 soal ada di dalamnya | menggantikan "Latihan" + "Simulasi ujian" |
| **Ujian akhir** | dinilai server, bertimer | satu nama di semua tempat |
| **Proyek akhir** | build yang diperiksa otomatis | |
| **Sertifikat** | bab selesai + lulus ujian (kalau ada) + proyek (kalau ada) | |
| **Jalur belajar** | urutan kelas yang disarankan (dulu "Roadmap") | saran, bukan syarat |
| **Kartu hafalan** | flashcard | bahan pendukung, bukan menu utama |

**Kelas selesai** = semua bab selesai (kalau berbab) dan lulus ujian akhir
(kalau ada ujian terbit). Satu fungsi SQL, dipakai roadmap, beranda,
pencapaian, dan halaman kelas.

**Navigasi yang sama sebelum dan sesudah masuk:**
- Header: logo, Kelas, Jalur belajar, (masuk: Beranda saya + menu akun).
- HP: satu bottom nav berlabel: Beranda, Kelas, Jalur, Saya/Masuk.
- Halaman baca/kuis/ujian: bar khusus (tanpa nav global) seperti halaman bab.
- Landing tidak lagi mengalihkan murid yang masuk; logo membawa murid ke
  Beranda saya.

## Rencana (urut dampak)

### Tahap 1: jelas dan konsisten (UI/UX + produk)
1. Satu navigasi untuk tamu dan murid (header + bottom nav berlabel);
   sidebar hanya untuk admin. Halaman login selalu punya jalan keluar.
2. Ganti istilah di seluruh UI sesuai tabel di atas.
3. Beranda saya (dulu Dasbor): satu kartu "Langkah berikutnya" (bab,
   ujian, proyek, atau sertifikat), daftar kelas yang diikuti dengan
   progres bab, satu baris streak. Lencana, progres jalur, dan sertifikat
   pindah ke **Pencapaian** (dulu Nilai).
4. Stepper jalur kelas di halaman latihan, ujian, proyek; setelah lulus
   ujian tombol utama ke proyek atau sertifikat.
5. Onboarding sekali setelah masuk pertama: nama tampilan + persetujuan
   wali dalam satu layar, supaya progres tidak hilang diam-diam.
6. HP: konten tidak tertutup bar; halaman baca, latihan, ujian tanpa nav
   global. Angka pilihan jawaban netral di semua soal (A-D).
7. Jalur belajar: panel kelas cukup ringkasan + "Buka kelas"; tombol
   "Tandai selesai" dihapus; tambah "Mulai dari kelas pertama".

### Tahap 2: satu model status (sistem)
8. Fungsi SQL `class_status` sebagai satu-satunya definisi selesai;
   roadmap, beranda, pencapaian, halaman kelas membacanya.
9. Sertifikat untuk kelas tanpa ujian; teks "Memeriksa syarat" tidak lagi
   menggantung; "Bab selesai" hanya tampil bila tersimpan; pesan error
   dibedakan (konten berubah vs belum setuju wali); `next=` kembali ke bab.
10. Semua tulis progres lewat `/rpc` (supabase-js keluar dari bundle
    halaman kelas/bab/slide/roadmap); halaman kelas statis dengan island
    kecil untuk progres.

### Tahap 3: konten (data)
11. Gabung dan pensiunkan: `git-dan-github` ke `github`, `html5` ke
    `html5-dan-css3`, `html-css-javascript` ditarik dari publik. Katalog
    menjadi 12 kelas.
12. Tulis ulang 12 kelas lama dengan jalur tulisan tangan (bab 900-1500
    kata, Tujuan/Rangkuman, latihan kode, proyek, ujian 60 soal). Prioritas
    kelas inti jalur: javascript, git, github, html5-dan-css3, reactjs, lalu
    nodejs, sql, vuejs, git-dan-gitlab, react-native. Sekitar 3 kelas per
    hari (batas impor 10/hari).
13. `draft:check` menolak soal yang bisa ditebak: jawaban benar sebagai
    opsi terpanjang lebih dari 35%, atau posisi tidak seimbang.
14. Selama belum ditulis ulang, kelas slide saja diberi label "Slide saja"
    di katalog dan halaman slidenya memakai bar dengan jalan kembali.

### Tahap 4: teknis (software)
15. Buang sisa Next.js (`proxy.ts`, paket `next`, `"use client"`,
    komentar), batasi `cache.ts`, worker menandai job gagal saat timeout,
    cek skew protection (fitur plan Pro; kalau tidak tersedia, reload
    sekali saat chunk gagal dimuat).
16. Tes e2e untuk murid yang masuk (login sampai sertifikat) dengan
    Supabase lokal di CI, tes unit `/rpc`, dijalankan sebelum merge.
17. Perbarui GUIDELINE (layout, glosarium, status, tes).

### Di luar kode
18. Akuisisi: belum ada murid nyata. Setelah tahap 1-2, uji ke satu kelas
    sekolah atau komunitas dan ukur funnel (daftar, buka bab, selesai bab,
    ujian, sertifikat).
