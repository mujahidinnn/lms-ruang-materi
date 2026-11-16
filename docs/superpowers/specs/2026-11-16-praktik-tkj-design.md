# Praktik untuk kelas TKJ: gambar, simulator Mikrotik, kelas Mikrotik, lab fisik

Tanggal: 2026-11-16. Status: menunggu persetujuan owner.

## Maksud

Jalur "Infrastruktur dan Sistem" (Dasar Komputer dan OS, Jaringan Komputer,
Administrasi Server) hari ini hanya teori, kuis, dan latihan JavaScript.
Pelajarnya anak TKJ: mereka harus bisa memegang kabel, router, dan Mikrotik.
Target owner: yang belajar benar-benar paham, teori dan praktik. Ukuran
berhasil: murid yang lulus kelas bisa (1) menyusun kabel UTP dengan urutan
yang benar, (2) mengonfigurasi router Mikrotik dasar (IP, DHCP, NAT) di
simulator tanpa melihat contoh, dan (3) mengulanginya di perangkat sungguhan
dengan panduan lab.

Owner memilih keempatnya dan menyerahkan caranya kepada Claude.

## Sasaran, bukan-sasaran, anti-sasaran

- Sasaran: tiap bab teori yang berbau perangkat punya padanan praktik; murid
  tanpa perangkat tetap bisa berlatih di browser; murid dengan perangkat punya
  langkah lab yang jelas.
- Bukan sasaran: meniru RouterOS secara penuh, Packet Tracer, video, jual alat.
- Anti-sasaran: gambar teknis yang keliru (urutan warna kabel salah lebih
  buruk daripada tanpa gambar); simulator yang mengajarkan perintah yang tidak
  ada di RouterOS asli; praktik yang cuma "baca lalu centang".

## Batasan

- Gaya visual: hitam, putih, matcha (lihat GUIDELINE "Style"); tanpa
  ketergantungan baru.
- Bahasa Indonesia, sapaan "kamu", tanpa tanda seru.
- Jalur konten tetap: draf JSON -> `draft:check` -> impor -> terbitkan.
  Re-import mengganti bab dan membawa progres lewat slug bab.
- Slot impor 10 per 24 jam; latihan kode berjalan di sandbox iframe 3 detik.

## Pendekatan yang dipertimbangkan

Gambar:
1. **SVG buatan kode, disimpan di repo** (dipilih). Akurat dan bisa
   diperiksa: urutan warna T568A/B, topologi, rack, port router, alur
   DHCP/NAT. Konsisten dengan `scripts/ilustrasi.mjs`.
2. Gambar AI lewat script Gemini web. Cepat dan bagus untuk dekorasi, tapi
   tidak bisa dipercaya untuk detail teknis. Hanya untuk hiasan bila perlu.
3. Foto hardware sungguhan. Perlu pemotretan dan hak cipta; ditunda.

Simulator Mikrotik:
1. **Jenis latihan baru `mikrotik`: terminal tiruan RouterOS di sandbox
   iframe yang sama, dengan mesin perintah kecil dan pemeriksa berupa
   ekspresi atas state router** (dipilih). Memakai pola `js`/`python` yang
   sudah ada.
2. Memakai jenis `js` dengan murid menulis kode JavaScript. Tidak melatih
   perintah RouterOS yang sebenarnya.
3. Menanam emulator RouterOS sungguhan (CHR di WebAssembly). Tidak ada yang
   siap pakai dan berat.

Kelas Mikrotik: kelas baru, ditulis tangan seperti kelas lain. Karena tidak
ada pptx sumber, deck pendukung dibuat sendiri dari diagram SVG tahap 1.
Alternatif: owner menyediakan pptx. Diputuskan di rencana.

Panduan lab: bab praktik biasa (tanpa jenis kode baru) di Jaringan Komputer
dan kelas Mikrotik: daftar alat, langkah, gambar, checklist hasil, dan kuis
skenario ("apa yang kamu lihat bila...") sebagai bukti paham, bukan sekadar
centang.

## Rancangan

Urutan, masing-masing proyek sendiri dengan rencananya sendiri:

1. **Gambar dan diagram.** Renderer bab mendukung `![ket](gambar:<nama>)`
   yang menunjuk file SVG di `public/praktik/<nama>.svg` (nama dibatasi huruf
   kecil, angka, tanda hubung; tanpa URL luar). Teks `ket` jadi alt. Set awal
   sekitar 10 gambar: UTP T568A/B, straight vs crossover, topologi,
   alur DHCP (DORA), NAT, rack, port router, VLAN, dan lain-lain yang dipakai
   bab. Dipakai di Jaringan Komputer dan kelas Mikrotik.
2. **Panduan lab fisik.** Bab praktik baru: crimping kabel UTP dan uji
   kabel, konfigurasi router pertama lewat Winbox, uji ping/traceroute lintas
   jaringan. Masuk draf Jaringan Komputer (re-import) dan kelas Mikrotik.
3. **Simulator Mikrotik.** Nilai `mikrotik` pada `code_kind`; `SandboxKind`
   dan `counted_exercise` ikut; terminal tiruan dengan subset perintah:
   `/interface print`, `/ip address add|print|remove`, `/ip dhcp-server setup`
   dan bagiannya, `/ip pool`, `/ip firewall nat add chain=srcnat
   action=masquerade`, `/ip route add`, `/ip dns set`, `/system identity set`,
   `/ping` (hasil dari state). Galat meniru pesan RouterOS ("input does not
   match any value of...", "failure: already have such address"). Pemeriksa:
   ekspresi JavaScript atas `state`. Subset didokumentasikan di GUIDELINE.
4. **Kelas Mikrotik (RouterOS dan Winbox).** Sekitar 8 bab: kenalan Mikrotik
   dan Winbox, interface dan IP, DHCP, NAT dan routing, firewall dasar,
   bridge dan VLAN, backup dan reset, proyek akhir (jaringan kantor kecil di
   simulator). Soal ujian dengan aturan yang sama dengan kelas lain: opsi
   benar tidak dominan terpanjang, posisi acak. Masuk jalur Infrastruktur dan
   Sistem setelah Jaringan Komputer.

Tiap bab teori perangkat mendapat padanan: gambar, latihan simulator, atau
bab lab, supaya "paham teori" selalu diikuti "bisa praktik".

## Diserahkan ke pembangun

- Daftar pasti gambar dan nama berkas; tata letak SVG (kartu putih dengan
  garis tinta, sesuai gaya).
- Daftar perintah simulator persisnya dan format `state`.
- Apakah deck kelas Mikrotik dibuat sendiri atau dari pptx owner.
- Pengujian: unit test mesin perintah, `draft:check` untuk latihan
  `mikrotik`, uji browser seperti latihan lain.

## Dicatat

Tinjauan pembangun lewat subagent tidak dijalankan untuk hemat token; dokumen
dibaca ulang sendiri. Keputusan yang diambil Claude atas nama owner: SVG
buatan kode (bukan gambar AI), jenis latihan baru `mikrotik`, urutan 1-4.
