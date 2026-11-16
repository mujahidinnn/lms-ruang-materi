# Kelas MikroTik RouterOS Dasar (mengikuti kerangka MTCNA)

Tanggal: 2026-11-16. Status: menunggu persetujuan owner. Ini proyek 4 dari
`2026-11-16-praktik-tkj-design.md`; dipecah menjadi 4a (perluasan simulator)
dan 4b (kelas, dek, rilis).

## Maksud

Murid TKJ yang selesai Jaringan Komputer bisa mengonfigurasi, mengelola, dan
memecahkan masalah dasar router MikroTik, dan siap mengikuti pelatihan
MTCNA. Owner meminta cakupan "gaya MTCNA" dan menyerahkan rinciannya.

Sumber cakupan: kerangka resmi MikroTik "Certified Network Associate (MTCNA)
Training outline", durasi 3 hari, prasyarat "good understanding of TCP/IP and
subnetting", bertanggal 22 Januari 2016 (mikrotik.com/training/about menautkan
berkasnya). Sembilan modulnya: Introduction, DHCP (termasuk ARP), Bridging,
Routing, Wireless, Firewall (filter, address-list, NAT, FastTrack), QoS
(simple queue, PCQ), Tunnels (PPP, PPPoE, PPTP, SSTP), Misc (tools dan
monitoring). Ujian sertifikasi resmi: 25 soal, 60 menit, lulus 60%.

## Sasaran, bukan-sasaran, anti-sasaran

- Sasaran: urutan dan kedalaman setara satu modul MTCNA per bab; praktik di
  simulator untuk yang bisa disimulasikan; ujian akhir berbentuk MTCNA.
- Bukan sasaran: jaminan lulus sertifikasi, kursus resmi MikroTik, emulasi
  RouterOS penuh, modul lanjutan (MTCRE, MTCWE, dan lainnya).
- Anti-sasaran: mengaku resmi atau berafiliasi dengan MikroTik; menyalin teks
  outline atau soal resmi; mengajarkan perintah yang tidak ada di RouterOS;
  menjanjikan praktik wireless dan tunnel di simulator yang tidak
  mendukungnya.

## Keputusan Claude atas nama owner

1. **Nama dan label:** judul "MikroTik RouterOS Dasar", subjudul "disusun
   mengikuti kerangka MTCNA", dan catatan di kelas: tidak resmi, kerangka
   bertanggal 2016 dan bisa berubah, cek outline terbaru sebelum ujian resmi.
2. **Slug dan prasyarat:** `mikrotik-routeros-dasar`, prasyarat
   `jaringan-komputer`; masuk jalur "Infrastruktur dan Sistem" sebagai cabang
   setelah Jaringan Komputer (sejajar dengan Administrasi Server).
3. **Dua belas bab** (tepat batas skema), satu per modul, dengan Introduction
   dibagi tiga dan Firewall dibagi dua:
   `mengenal-routeros-dan-winbox`, `cli-dan-konfigurasi-awal`,
   `pemeliharaan-routeros`, `dhcp-dan-arp`, `bridge`, `routing-statik`,
   `wireless-dasar`, `firewall-filter`, `nat-dan-fasttrack`, `qos-queue`,
   `tunnel-ppp-dan-vpn`, `alat-bantu-dan-monitoring`.
   Bab Introduction mengulang bab praktik router pertama dengan lebih dalam,
   bukan menyalinnya.
4. **Praktik per bab:** simulator untuk CLI dan konfigurasi awal, DHCP dan
   lease statis, bridge dan port, routing statik, firewall filter dan
   address-list, NAT, queue sederhana, layanan dan pengguna. Wireless,
   tunnel (PPP, PPPoE, PPTP, SSTP), upgrade, backup, dan Netinstall tetap
   teori dengan panduan lab fisik, karena tidak disimulasikan.
5. **Perluasan simulator (4a):** perintah baru di interpreter `mikrotik`:
   `/interface bridge add|print`, `/interface bridge port add|print`,
   `/ip dhcp-server lease add|print`, `/ip firewall filter add|print`
   (chain, action, protocol, dst-port, src-address, in-interface,
   connection-state), `/ip firewall address-list add|print`,
   `/queue simple add|print` (name, target, max-limit), `/ip service
   print|set` (disabled), `/user add|print`. Pola sama dengan proyek 3:
   state di `router`, galat meniru RouterOS (dengan batas kejujuran), tes
   per perintah, GUIDELINE diperbarui.
6. **Proyek akhir:** kantor kecil di simulator (identity, LAN, DHCP dan
   lease statis, NAT, aturan firewall dasar input dan forward, satu queue,
   rute statik), jenis `mikrotik`, 8 sampai 12 pemeriksaan.
7. **Ujian bentuk MTCNA:** bank 40 soal, per percobaan 25 soal, 60 menit,
   nilai lulus 60, tiga percobaan (parameter diubah setelah terbit lewat
   `/admin/ujian`). Soal berskenario dan membaca keluaran, tanpa menyalin
   soal resmi.
8. **Dek pendukung:** tidak ada pptx sumber, jadi dek sekitar 24 slide dibuat
   dari diagram SVG proyek 1 dan ringkasan modul, hanya untuk jangkar
   rentang slide dan mode slide; bab tetap pembelajaran utama.
9. **Aturan konten:** sama dengan kelas lain (bab 900-1500 kata, kuis 3-5
   soal berskenario, flashcard 15-30, ujian 40, latihan 12, tips 3-6),
   ditambah pemeriksa bias kunci jawaban yang sudah ada.

## Pendekatan yang dipertimbangkan

- Satu proyek besar: ditolak, karena perluasan simulator berupa kode inti
  dengan peninjauan sendiri dan konten bergantung padanya.
- **4a lalu 4b (dipilih):** simulator dulu, lalu kelas yang memakainya.
- Kelas tanpa perluasan simulator: ditolak untuk firewall, bridge, dan
  queue, karena itu inti MTCNA dan paling butuh praktik.
- Dek dibuat otomatis dari outline: ditolak, tidak ada alasan menyalin;
  dek ringkas dari diagram kita sendiri sudah cukup.

## Diserahkan ke pembangun

Daftar flashcard, soal, dan skenario kuis; tata bahasa pesan galat perintah
baru; isi tiap slide dek; skenario proyek akhir; dan cara membuat pptx
(alat yang tersedia di lingkungan).

## Dicatat

Kerangka diambil dari berkas resmi 2016 yang ditautkan MikroTik; versi
terbaru belum dibaca. Tinjauan pembangun lewat subagent tidak dijalankan
untuk hemat token.
