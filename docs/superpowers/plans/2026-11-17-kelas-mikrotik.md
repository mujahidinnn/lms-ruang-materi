# Kelas MikroTik RouterOS Dasar (4b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kelas `mikrotik-routeros-dasar` (12 bab mengikuti kerangka MTCNA, proyek akhir di simulator, ujian 25 soal) terbit di jalur "Infrastruktur dan Sistem" setelah Jaringan Komputer.

**Architecture:** Konten ditulis tangan sebagai draf JSON (`content/drafts/mikrotik-routeros-dasar.json`) dan melewati jalur biasa: `draft:check`, unggah pptx ke Storage, `import:manual`, `publish:topic`. Tiga perubahan pendukung: skema draf menyimpan bank ujian sampai 60 soal, empat diagram SVG baru, dan dek pptx 28 slide yang dibuat dari ringkasan modul dan diagram.

**Tech Stack:** Draf JSON, `scripts/check-draft.ts`, `scripts/praktik.mjs` (SVG), vitest, python-pptx di venv sementara (di luar repo) untuk dek, Playwright MCP.

**Spec:** `docs/superpowers/specs/2026-11-16-kelas-mikrotik-design.md` (proyek 4b). Simulator: `GUIDELINE.md` entri jenis `mikrotik` (perintah dan bentuk `router`).

## Global Constraints

- **Hak cipta:** tulis penjelasan, soal, dan contoh sendiri. Jangan menyalin teks outline MTCNA, dokumentasi MikroTik, soal ujian resmi, atau materi situs sekolah mana pun (situs TJKT SMKN 1 Klaten hanya rujukan topik, tanpa lisensi terbuka).
- **Label dan klaim:** judul `MikroTik RouterOS Dasar (kerangka MTCNA)`; deskripsi dan bab 1 menyatakan kelas ini tidak resmi dan tidak berafiliasi dengan MikroTik, kerangka acuan bertanggal 22 Januari 2016 dan bisa berubah, dan murid sebaiknya memeriksa outline terbaru sebelum ujian resmi. Dilarang menjanjikan lulus sertifikasi.
- Kelas punya **tepat 12 bab** (batas skema): slug, urutan, rentang slide, dan isi di tabel Task 4 sampai 7. Aturan `check-draft` berlaku: bab 900 sampai 1500 kata, mulai `## Tujuan`, akhiri `## Rangkuman`, kuis 3 sampai 5 soal berskenario, maksimal 1 sisipan `slide:N` dan 3 `gambar:` per bab, `slide_to` tidak melebihi 28, flashcard 15-30, latihan 10-15, tips 3-6, ujian bank 50, pemeriksa bias kunci jawaban (batas 40%) hijau.
- Bahasa Indonesia, sapaan "kamu", tanpa tanda seru. Alamat contoh `192.168.88.0/24`, `203.0.113.x`, `198.51.100.x`; target ping `8.8.8.8` boleh.
- Latihan jenis `mikrotik` memakai hanya perintah yang ada di GUIDELINE (simulator); solusi harus lolos tes sendiri dan kode awal tidak boleh lolos semua tes (`draft:check` membuktikan). Maksimal 2 latihan per bab dan 6 tes per latihan. Wireless, tunnel, upgrade, backup, Netinstall tetap teori dengan panduan lab fisik.
- Fakta RouterOS dan MikroTik yang disebut harus benar untuk RouterOS yang umum dipakai; bila perilaku berbeda antara v6 dan v7 (mis. flag rute `As`/`S`, bridge VLAN filtering, perintah `/ip dhcp-server setup` interaktif), sebut bedanya. Hal yang tidak pasti ditulis hati-hati ("pada kebanyakan model"), bukan dipastikan.
- Tidak ada perubahan simulator, sandbox, skema DB, atau UI selain yang tertulis di Task 1.
- Tanpa dependensi baru di repo; python-pptx hanya di venv di folder scratchpad, tidak masuk repo.

## Review Focus

- Bank 50 soal bisa terbit: pemicu `check_exam_bank` mewajibkan bank minimal 2 kali `question_count` (25 butuh 50) dan `import` hanya menyimpan 40 kecuali skema diubah (Task 1); setelah terbit parameter ujian harus 25 soal, 60 menit, lulus 60, 3 percobaan, dan impor ulang mengembalikan default sehingga harus diterapkan lagi.
- Proyek akhir terverifikasi otomatis saat impor (jenis bukan `web` dan solusi lolos); bila tidak, proyek tersembunyi dan menghalangi sertifikat.
- Dek: 28 slide, terbaca saat dirender (soffice), rentang slide semua bab valid; mode slide tidak kosong.
- Prasyarat `jaringan-komputer` ada dan node jalur memakai edge dari Jaringan Komputer.
- Tidak ada teks salinan; label tidak resmi terlihat; fakta teknis (lisensi RouterOS, flag, bridge, firewall, queue, PPPoE) ditinjau di ulasan akhir.

---

## File Structure

- `worker/prompt.ts`, `worker/prompt.test.ts` (ubah): bank ujian sampai 60.
- `scripts/praktik.mjs`, `lib/praktik/svg.test.ts` (ubah), `public/praktik/*.svg` (baru, 4): diagram baru.
- `scripts/deck-mikrotik.py` (baru): pembuat dek; `public/MikroTik_RouterOS_Dasar.pptx` (hasil, di-ignore git).
- `content/drafts/mikrotik-routeros-dasar.json` (baru): seluruh kelas.
- Tidak ada berkas aplikasi lain.

### Task 1: Bank ujian sampai 60 soal

**Files:**
- Modify: `worker/prompt.ts`, `worker/prompt.test.ts`

**Interfaces:**
- Produces: `draftSchema` memparse `exam_questions` 40 sampai 60 soal dan **menyimpan semuanya** (bukan memotong ke 40). Draf lama (tepat 40) tetap 40. `repairClass` dan `parseDraft`-semacamnya yang memotong ke 40 (cari `slice(0, 40)` dan `slice(0, 60)`) diselaraskan.

- [ ] **Step 1: Tulis tes yang gagal** di `worker/prompt.test.ts`: draf dengan 50 soal ujian menghasilkan 50 setelah `draftSchema.parse`; 40 menghasilkan 40; 39 ditolak; 61 ditolak atau dipotong ke 60 sesuai perilaku yang dipilih (tulis tes sesuai kode dan pilih: lebih dari 60 dipotong ke 60); soal ujian hasil parse tidak mengubah urutan.
- [ ] **Step 2:** `npx vitest run worker`. Hasil: tes 50 gagal (kini 40).
- [ ] **Step 3: Implementasi** di `worker/prompt.ts`: ganti `transform((qs) => qs.slice(0, 40))` menjadi `slice(0, 60)`; periksa kode lain di `worker/` dan `scripts/` yang mengasumsikan 40 (grep `40`, `exam_questions`) dan sesuaikan; pesan galat `check-draft` tetap menampilkan jumlah ujian.
- [ ] **Step 4:** `npx vitest run` dan `npm run draft:check -- jaringan-komputer 38` (tetap 40 ujian, OK). Hasil: hijau.
- [ ] **Step 5: Commit** `git add worker && git commit -m "Draft schema keeps up to 60 exam questions so a class can run 25-question exams"`

### Task 2: Empat diagram baru

**Files:**
- Modify: `scripts/praktik.mjs`, `lib/praktik/svg.test.ts`
- Create: `public/praktik/firewall-chain-flow.svg`, `bridge-vs-router.svg`, `queue-simple-limit.svg`, `ppp-tunnel.svg`

**Interfaces:**
- Consumes: `frame`, `text`, `box`, `line`, `circle`, `arrow` dari `scripts/praktik.mjs` (proyek 1).
- Produces: empat berkas SVG; `EXPECTED` di `svg.test.ts` diperluas jadi 14 nama dan `READY` mengikuti.

- [ ] **Step 1:** Tambahkan keempat nama ke `EXPECTED` (tes "diagrams that are built exist" gagal). Jalankan `npx vitest run lib/praktik` untuk melihat gagal.
- [ ] **Step 2: Gambar.** `firewall-chain-flow`: paket masuk, `prerouting`/dst-nat, keputusan "untuk router?" cabang ke chain `input` (ke router) atau `forward` (melewati router), `output` (dari router), lalu `postrouting`/src-nat, dengan catatan connection tracking (established, related, new, invalid). `bridge-vs-router`: dua kolom, bridge (lapis 2: satu segmen, MAC, switch-like, port ether2 dan ether3 dalam `bridge1`) dan router (lapis 3: dua jaringan, IP, rute). `queue-simple-limit`: target `192.168.88.0/24` dengan `max-limit` unggah dan unduh, antrean dan batas (limit-at, max-limit, burst disebut sebagai opsi tanpa angka). `ppp-tunnel`: klien (laptop di rumah) dan server (router kantor) dengan terowongan PPPoE/PPTP/SSTP, pool alamat, dan PPP secret/profile sebagai kotak.
- [ ] **Step 3:** `node scripts/praktik.mjs && npx vitest run lib/praktik`. Hasil: tes keamanan dan keberadaan lulus.
- [ ] **Step 4: Cek visual** dengan `playwright-core` lokal (cara proyek 1: tulis skrip sementara di repo yang di-ignore, ambil PNG tiap SVG, baca gambarnya): teks terbaca, tidak terpotong, fakta benar. Perbaiki sampai rapi.
- [ ] **Step 5: Commit** `git add scripts/praktik.mjs lib/praktik public/praktik && git commit -m "Four MikroTik diagrams: firewall chains, bridge vs router, simple queue, PPP tunnels"`

### Task 3: Dek pendukung 28 slide

**Files:**
- Create: `scripts/deck-mikrotik.py`
- Output (tidak di-commit): `public/MikroTik_RouterOS_Dasar.pptx`

**Interfaces:**
- Produces: pptx 28 slide. Pemetaan slide ke bab (dipakai Task 4 sampai 7): 1 judul; 2 agenda dan label tidak resmi; 3-4 bab 1; 5-6 bab 2; 7-8 bab 3; 9-10 bab 4; 11-12 bab 5; 13-14 bab 6; 15-16 bab 7; 17-18 bab 8; 19-20 bab 9; 21-22 bab 10; 23-24 bab 11; 25-26 bab 12; 27 rangkuman; 28 penutup dan langkah berikutnya.

- [ ] **Step 1: Siapkan alat.** Buat venv di scratchpad (bukan repo): `python3 -m venv <scratchpad>/pptx-venv && <scratchpad>/pptx-venv/bin/pip install python-pptx`. Konversi SVG ke PNG (untuk slide gambar) lewat `playwright-core` seperti Task 2.
- [ ] **Step 2: Tulis `scripts/deck-mikrotik.py`** (di repo, memakai python-pptx dari venv) yang menghasilkan dek: tiap slide modul berisi judul modul, 4 sampai 6 butir ringkas (bukan salinan teks outline atau dokumentasi), dan di slide kedua tiap modul satu diagram PNG yang relevan (gunakan `rj45`/`router-5-port`/`kantor-kecil-mikrotik`, `dhcp-dora`, `bridge-vs-router`, `topologi-dasar` atau `kantor-kecil-mikrotik` untuk routing, diagram `firewall-chain-flow`, `nat-masquerade`, `queue-simple-limit`, `ppp-tunnel`) bila ada; gaya hitam putih matcha seperti situs (latar putih, aksen `#b5d36f`, teks `#0f100d`); slide 2 memuat label tidak resmi dan catatan kerangka 2016.
- [ ] **Step 3: Verifikasi.** `python3`/venv menjalankan skrip tanpa galat; `unzip -Z1` menunjukkan 28 `ppt/slides/slide*.xml`; `soffice --headless --convert-to pdf` menghasilkan PDF 28 halaman; ubah dua sampai tiga halaman jadi PNG (`pdftoppm`) dan baca: teks tidak terpotong dan terbaca.
- [ ] **Step 4: Commit** hanya skrip: `git add scripts/deck-mikrotik.py && git commit -m "Generator for the MikroTik class support deck"` (pptx di-ignore git).

### Task 4: Bab 1 sampai 3

**Files:**
- Create/Modify: `content/drafts/mikrotik-routeros-dasar.json` (draf awal berisi bab 1 sampai 3 dan kerangka metadata sementara yang lolos skema; metadata final di Task 8)

| # | slug | judul | slide | gambar | latihan simulator |
| --- | --- | --- | --- | --- | --- |
| 1 | `mengenal-routeros-dan-winbox` | Mengenal RouterOS dan Winbox | 3-4 | `router-5-port`, `kantor-kecil-mikrotik` | tidak ada |
| 2 | `cli-dan-konfigurasi-awal` | CLI dan Konfigurasi Awal Internet | 5-6 | `kantor-kecil-mikrotik` | satu: konfigurasi awal Internet (identity, `dhcp-client` di ether1, alamat LAN di ether2, NAT masquerade) |
| 3 | `pemeliharaan-routeros` | Pemeliharaan RouterOS | 7-8 | tidak ada | satu: amankan layanan dan pengguna (`/ip service set` disabled, `/user add` grup `read`) |

Isi wajib per bab (tulis dengan kata sendiri):
1. RouterOS dan RouterBOARD, cara mengakses (Winbox, MAC-Winbox, WebFig, SSH, Telnet, kabel konsol), konfigurasi bawaan, Quick Set, label tidak resmi, dan prasyarat subnetting.
2. Prinsip CLI (tab, dua kali tab, tanda tanya, navigasi, riwayat perintah, `print`, `add`, `set`, `remove`, `export`), konfigurasi awal Internet (WAN DHCP client, alamat LAN, rute bawaan, NAT masquerade), identitas router.
3. Jenis paket dan cara upgrade, firmware RouterBOOT, backup versus export `.rsc` dan mengedit export, reset, Netinstall, tingkat lisensi, layanan dan login, sumber informasi.

- [ ] **Step 1:** Tulis bab 1 sampai 3 dengan struktur `## Tujuan`, penjelasan bertahap (`##` dan `###`), contoh perintah di blok kode, `## Rangkuman`; 3 sampai 5 kuis skenario per bab (campuran pilihan ganda, benar-salah, dan `baca_kode` yang menampilkan keluaran perintah); latihan sesuai tabel dengan `setup` `awal` bila perlu. Opsi benar tidak dominan terpanjang; posisi acak.
- [ ] **Step 2:** `npm run draft:check -- mikrotik-routeros-dasar 28`. Hasil: bab 1 sampai 3 tanpa masalah (masalah metadata lain boleh tersisa sampai Task 8).
- [ ] **Step 3: Commit** `git add content/drafts/mikrotik-routeros-dasar.json && git commit -m "MikroTik class: chapters 1-3 (RouterOS basics, CLI and first internet config, maintenance)"`

### Task 5: Bab 4 sampai 6

**Files:**
- Modify: `content/drafts/mikrotik-routeros-dasar.json`

| # | slug | judul | slide | gambar | latihan simulator |
| --- | --- | --- | --- | --- | --- |
| 4 | `dhcp-dan-arp` | DHCP dan ARP | 9-10 | `dhcp-dora` | satu: server DHCP dengan lease statis untuk satu perangkat |
| 5 | `bridge` | Bridge | 11-12 | `bridge-vs-router` | satu: bridge LAN (bridge, dua port, alamat di bridge) |
| 6 | `routing-statik` | Routing Statik | 13-14 | `kantor-kecil-mikrotik` | satu: dua rute (utama dan cadangan dengan `distance` lebih besar) |

Isi wajib: 4. server dan client DHCP, lease dan lease statis, jaringan DHCP, ARP, tabel ARP, mode ARP (enabled, reply-only, dan lainnya), static ARP. 5. bridge, port, konsep lapis 2, bridge dan jaringan nirkabel, mode station (teori), beda bridge dan router. 6. routing dasar, tabel rute, flag rute (v6 dan v7), rute statik, rute bawaan, `distance`, rute dinamis dan terhubung.

- [ ] **Step 1:** Tulis bab 4 sampai 6 dengan aturan yang sama seperti Task 4 (struktur, kuis berskenario 3-5, latihan, bias).
- [ ] **Step 2:** `npm run draft:check -- mikrotik-routeros-dasar 28`. Hasil: bab 1 sampai 6 tanpa masalah.
- [ ] **Step 3: Commit** `git add content/drafts/mikrotik-routeros-dasar.json && git commit -m "MikroTik class: chapters 4-6 (DHCP and ARP, bridge, static routing)"`

### Task 6: Bab 7 sampai 9

**Files:**
- Modify: `content/drafts/mikrotik-routeros-dasar.json`

| # | slug | judul | slide | gambar | latihan simulator |
| --- | --- | --- | --- | --- | --- |
| 7 | `wireless-dasar` | Wireless Dasar | 15-16 | tidak ada | tidak ada (teori dan panduan lab fisik) |
| 8 | `firewall-filter` | Firewall Filter | 17-18 | `firewall-chain-flow` | dua: lindungi router (aturan input) dan blokir dengan address-list (aturan forward) |
| 9 | `nat-dan-fasttrack` | NAT dan FastTrack | 19-20 | `nat-masquerade` | dua: port forwarding `dst-nat`, dan FastTrack untuk koneksi established dan related |

Isi wajib: 7. konsep 802.11a/b/g/n/ac, frekuensi, kanal, laju data dan chain, mode AP dan station, keamanan (WPA2-PSK, access list, connect list), alat pantau (snooper, registration table); panduan lab fisik untuk membuat AP. 8. prinsip firewall, connection tracking dan status koneksi, chain input dan forward dan output, aksi, melindungi router dan pelanggan, address-list dasar, urutan aturan. 9. src-nat dan masquerade, dst-nat dan redirect, port forwarding, FastTrack dan batasannya.

- [ ] **Step 1:** Tulis bab 7 sampai 9 (aturan sama).
- [ ] **Step 2:** `npm run draft:check -- mikrotik-routeros-dasar 28`. Hasil: bab 1 sampai 9 tanpa masalah.
- [ ] **Step 3: Commit** `git add content/drafts/mikrotik-routeros-dasar.json && git commit -m "MikroTik class: chapters 7-9 (wireless, firewall filter, NAT and FastTrack)"`

### Task 7: Bab 10 sampai 12

**Files:**
- Modify: `content/drafts/mikrotik-routeros-dasar.json`

| # | slug | judul | slide | gambar | latihan simulator |
| --- | --- | --- | --- | --- | --- |
| 10 | `qos-queue` | QoS dan Queue | 21-22 | `queue-simple-limit` | satu: batasi bandwidth satu segmen dengan simple queue |
| 11 | `tunnel-ppp-dan-vpn` | Tunnel PPP dan VPN | 23-24 | `ppp-tunnel` | tidak ada (teori dan panduan lab fisik) |
| 12 | `alat-bantu-dan-monitoring` | Alat Bantu dan Monitoring | 25-26 | tidak ada | satu: uji konektivitas dengan `ping` pada konfigurasi yang sudah ada |

Isi wajib: 10. simple queue, target, `max-limit` dan `limit-at`, burst, satu queue untuk seluruh jaringan (PCQ) sebagai konsep. 11. pengaturan PPP, profile, secret, pool, PPPoE (client dan server), PPTP dan SSTP, alamat titik-ke-titik. 12. e-mail, Netwatch, ping, traceroute, profiler, monitoring trafik, Torch, grafik, SNMP, The Dude.

- [ ] **Step 1:** Tulis bab 10 sampai 12 (aturan sama).
- [ ] **Step 2:** `npm run draft:check -- mikrotik-routeros-dasar 28`. Hasil: 12 bab tanpa masalah bab.
- [ ] **Step 3: Commit** `git add content/drafts/mikrotik-routeros-dasar.json && git commit -m "MikroTik class: chapters 10-12 (queues, tunnels, tools and monitoring)"`

### Task 8: Metadata kelas, soal, flashcard, proyek akhir

**Files:**
- Modify: `content/drafts/mikrotik-routeros-dasar.json`

**Interfaces:**
- Produces: bagian non-bab dari draf: `title` `MikroTik RouterOS Dasar (kerangka MTCNA)`; `description` (satu kalimat, tidak resmi); `summary` 2-3 paragraf; `tips` 5; `flashcards` 24; `practice_questions` 12; `exam_questions` **50** (berskenario, sebaran 12 bab, tidak sama dengan soal latihan, bukan salinan soal resmi); `prerequisites: ["jaringan-komputer"]`; `project` jenis `mikrotik`: "Kantor Kecil MikroTik" dengan `brief`, `starter` komentar, `solution`, `setup` (`awal` bila perlu), dan 8 sampai 12 tes yang mencakup identity, alamat LAN, DHCP dengan lease statis, NAT masquerade, aturan firewall input dan forward dasar, satu queue, dan rute statik.

- [ ] **Step 1:** Tulis semua bagian di atas dengan fakta yang benar dan tanpa menyalin sumber. Soal ujian: 40 sampai 50 soal pilihan ganda dan `baca_kode` dan sekitar seperempat benar-salah; opsi benar tidak dominan terpanjang; posisi merata.
- [ ] **Step 2:** `npm run draft:check -- mikrotik-routeros-dasar 28`. Hasil: `OK, siap diimpor`, tanpa masalah bias, proyek lolos dan kode awal gagal.
- [ ] **Step 3: Commit** `git add content/drafts/mikrotik-routeros-dasar.json && git commit -m "MikroTik class: metadata, flashcards, practice and 50-question exam bank, final project"`

### Task 9: Rilis

**Files:** tidak ada perubahan berkas (data produksi); dijalankan controller setelah ulasan akhir.

- [ ] **Step 1: Pra-syarat.** Ulasan akhir cabang selesai dan bersih; `git push`; tunggu build git Ready (jangan `vercel redeploy` sebelum itu). Slot impor tersedia (kurang dari 10 job per 24 jam).
- [ ] **Step 2: Unggah dek** ke Storage `imports/migrasi/mikrotik-routeros-dasar.pptx` (service role, upsert). Jalankan `npm run import:manual -- mikrotik-routeros-dasar` di latar, tunggu `done`, lalu `npm run publish:topic -- mikrotik-routeros-dasar --track infrastruktur-dan-sistem --after jaringan-komputer`.
- [ ] **Step 3: Parameter ujian.** Setelah terbit, perbarui baris `exams` topik ini: `question_count 25`, `duration_minutes 60`, `pass_score 60`, `max_attempts 3` (urutan: pastikan bank terbit 50 dahulu agar pemicu `check_exam_bank` lolos; bila publish ujian terpisah dari topik, terbitkan dahulu).
- [ ] **Step 4: Verifikasi database:** topik terbit; 12 bab terbit sesuai slug draf; 28 slide; ujian 50 soal terbit dengan parameter di atas; latihan 12; kuis bab sama dengan draf; `code_exercises` memuat latihan `mikrotik` sesuai tabel; proyek terbit dengan `verified_at` terisi; node jalur ada dengan edge dari Jaringan Komputer.
- [ ] **Step 5: Cache.** Setelah build git terakhir Ready dan data terbit, jalankan satu `vercel redeploy` (penerbitan lewat RPC tidak menyegarkan cache).
- [ ] **Step 6: Browser** (tamu; sesi login harus keluar): halaman kelas menampilkan 12 bab dan label tidak resmi; satu bab dari tiap batch dibuka dengan gambar dan tabel, tanpa scroll horizontal di 390px; semua latihan `mikrotik` (solusi lolos, kode awal gagal, galat tampil di terminal); proyek akhir solusi lolos; halaman awal ujian menampilkan 25 soal, 60 menit, nilai minimum 60, 3 percobaan (tanpa memulai ujian); halaman jalur `infrastruktur-dan-sistem` menampilkan node baru. Jangan memakai akun owner; bila terpaksa, hapus semua progres uji sesudahnya.
- [ ] **Step 7:** Laporkan ke owner dengan ringkasan, tangkapan layar, dan daftar keputusan.

## Self-review

- Cakupan spec 4b: 12 bab sesuai modul MTCNA (Task 4 sampai 7), praktik simulator per bab yang mendukung, proyek akhir dan ujian 25 soal (Task 8, 9), dek 28 slide (Task 3), diagram pendukung (Task 2), label dan klaim hati-hati (Global Constraints), penerbitan di jalur (Task 9).
- Nama konsisten: slug bab, `mikrotik-routeros-dasar`, 28 slide dan rentang slide di tabel, bank 50 dan `question_count` 25.
- Risiko sisa: kualitas dan akurasi konten ditinjau manusia di ulasan akhir; kerangka acuan 2016; kelas penuh 12 bab.
