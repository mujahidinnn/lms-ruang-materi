# Bab Praktik Lab Fisik Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tiga bab praktik di kelas Jaringan Komputer (crimping dan uji kabel UTP, router MikroTik pertama lewat Winbox, uji konektivitas ping/traceroute), masing-masing dengan kuis skenario sebagai bukti paham, dan pemeriksa bias kunci jawaban yang mencegah masalah lama berulang.

**Architecture:** Isi murni konten: tiga bab ditulis tangan di `content/drafts/jaringan-komputer.json`, disisipkan di antara bab teori, diimpor ulang lewat jalur biasa (`import:manual`, `publish:topic`). Satu perubahan kode kecil: `lib/answer-bias.ts` dipakai `scripts/check-draft.ts`.

**Tech Stack:** Draf JSON + `scripts/check-draft.ts` (skema zod `worker/prompt.ts`), vitest, Playwright MCP untuk cek produksi.

**Spec:** `docs/superpowers/specs/2026-11-16-praktik-tkj-design.md` (proyek 2 dari 4). Diagram dari proyek 1 dipakai ulang.

## Global Constraints

- Kelas `jaringan-komputer` punya 9 bab; skema membatasi **maksimal 12 bab**. Tiga bab baru membuatnya tepat 12: tidak ada ruang untuk bab lagi (kelas Mikrotik di proyek 4 terpisah).
- Aturan `check-draft` berlaku: body 900-1500 kata, mulai `## Tujuan`, akhiri `## Rangkuman`, kuis minimal 3 soal, maksimal 1 sisipan `slide:N` dan 3 `gambar:` per bab, `slide_to` tidak melebihi 38.
- Bahasa Indonesia, sapaan "kamu", tanpa tanda seru. Alamat contoh dari blok dokumentasi atau `192.168.x.x`; target ping `8.8.8.8` boleh.
- Soal: tepat satu jawaban benar; `pilihan_ganda` dan `baca_kode` 4 opsi, `benar_salah` 2 opsi; opsi benar tidak boleh dominan terpanjang, posisi jawaban diacak (aturan ini kini diperiksa kode, Task 1).
- Fakta RouterOS yang tidak boleh keliru: pengguna bawaan `admin`, sandi kosong pada banyak model tetapi sebagian model memakai sandi di stiker perangkat (suruh periksa stiker); alamat bawaan `192.168.88.1/24` dan Winbox bisa terhubung lewat alamat MAC; `/system reset-configuration` menghapus konfigurasi (beri peringatan); `/ping 8.8.8.8 count=4`; `/tool traceroute 8.8.8.8`; tahan klip RJ45 dengan kontak menghadap kamu dan klip menjauh (sama dengan gambar `rj45-konektor`).
- Keselamatan praktik: sebut alat (crimping tool, LAN tester, stripper, konektor RJ45, kabel UTP Cat5e/Cat6), jangan memotong kabel yang sedang berlistrik PoE, dan jangan menyuruh membuka layanan router ke internet.
- Checklist memakai `- [ ]` Markdown (tidak interaktif; bukan fitur baru).

## Review Focus

- Impor ulang memakai 1 dari 10 slot per 24 jam dan merender 38 slide (sekitar 10 menit); gagal di tengah tidak boleh mengubah isi terbit (periksa status job dan bahwa topik tetap terbit).
- Penerbitan mengganti seluruh set soal ujian dan latihan: setelahnya jumlah harus tetap 40 ujian, 12 latihan, dan kata-kata soal hasil perbaikan bias harus utuh (draf sudah sinkron, jangan impor dari salinan lama).
- Slug bab lama tidak boleh berubah (progres bab dibawa lewat slug); posisi baru tidak boleh membuat bab lama hilang.
- `hasilTester` dengan warna ganda atau hilang di salah satu ujung harus `salah` tanpa melempar galat.
- Bab dengan gambar, tabel, dan latihan tetap muat di 390px tanpa scroll horizontal.

---

## File Structure

- `lib/answer-bias.ts` (baru), `lib/answer-bias.test.ts` (baru): ukuran bias kunci jawaban.
- `scripts/check-draft.ts` (ubah): memakai ukuran itu.
- `content/drafts/jaringan-komputer.json` (ubah): tiga bab baru.

### Task 1: Pemeriksa bias kunci jawaban

**Files:**
- Create: `lib/answer-bias.ts`, `lib/answer-bias.test.ts`
- Modify: `scripts/check-draft.ts`

**Interfaces:**
- Produces (di `lib/answer-bias.ts`), semua menerima `{ type: string; options: string[]; answer: number }[]` dan mengabaikan soal `benar_salah`; kembalian 0 bila tidak ada soal pilihan:
  - `longestCorrectShare(qs): number`: porsi soal yang opsi benarnya sama dengan panjang maksimum opsi (seri dihitung terpanjang), rentang 0 sampai 1.
  - `maxPositionShare(qs): number`: porsi terbesar yang dimiliki satu indeks jawaban.
  - `BIAS_LIMIT = 0.4`.

- [ ] **Step 1: Tulis tes yang gagal** di `lib/answer-bias.test.ts`: semua opsi benar paling panjang menghasilkan `1`; tidak ada yang terpanjang menghasilkan `0`; seri panjang dihitung (opsi benar sama panjang dengan yang lain menghasilkan `1`); soal `benar_salah` diabaikan (daftar hanya berisi benar_salah menghasilkan `0`); daftar kosong menghasilkan `0`; `maxPositionShare` pada jawaban `[0,0,0,1]` menghasilkan `0.75`.
- [ ] **Step 2:** `npx vitest run lib/answer-bias.test.ts`. Hasil: gagal (modul belum ada).
- [ ] **Step 3: Implementasi** tiga ekspor di `lib/answer-bias.ts`. Di `scripts/check-draft.ts` tambah masalah `bias panjang opsi: <nama kumpulan> <persen>` bila `longestCorrectShare` melebihi `BIAS_LIMIT` untuk kumpulan `exam_questions`, `practice_questions`, dan seluruh kuis bab digabung, dan `bias posisi jawaban ujian: <persen>` bila `maxPositionShare(exam_questions)` melebihi `BIAS_LIMIT`.
- [ ] **Step 4:** `npx vitest run lib/answer-bias.test.ts` lulus; `npm run draft:check -- dasar-komputer-dan-os 30`, `jaringan-komputer 38`, `administrasi-server-dan-keamanan 21` ketiganya `OK, siap diimpor` (porsi mereka sudah di bawah 0,4 setelah perbaikan sebelumnya).
- [ ] **Step 5: Commit** `git add lib/answer-bias.ts lib/answer-bias.test.ts scripts/check-draft.ts && git commit -m "check-draft flags answer keys that lean on the longest option or one position"`

### Task 2: Bab `praktik-kabel-utp`

**Files:**
- Modify: `content/drafts/jaringan-komputer.json`

**Interfaces:**
- Produces: bab dengan `slug` `praktik-kabel-utp`, judul "Praktik: Crimping dan Uji Kabel UTP", `est_minutes` 35, `slide_from` 15, `slide_to` 18, ditaruh tepat setelah `perangkat-dan-media-transmisi`. Gambar yang dipakai: `rj45-konektor`, `utp-t568a-t568b`.

- [ ] **Step 1: Tulis bab** dengan bagian berurutan: `## Tujuan`, `## Alat dan Bahan`, `## Langkah Crimping Kabel Straight T568B` (mengupas selubung sekitar 2 cm, meluruskan dan mengurutkan pasangan, memotong rata, memasukkan sampai ujung kabel menyentuh bagian depan konektor, crimping, ulangi di ujung lain), `## Menguji dengan LAN Tester` (urutan lampu 1 sampai 8 untuk straight; crossover: 3, 6, 1, 4, 5, 2, 7, 8; satu lampu mati artinya putus atau tidak kontak; dua lampu tertukar artinya urutan warna salah), `## Checklist Hasil`, `## Kalau Tidak Berhasil` (tabel gejala, penyebab, perbaikan), `## Rangkuman`.
- [ ] **Step 2: Kuis skenario** 4 sampai 5 soal, termasuk satu `baca_kode` yang menampilkan urutan lampu tester (mis. `1 2 3 4 5 6 7 8` dan `1 2 3 5 4 6 7 8`) dan menanyakan arti hasilnya; opsi benar tidak dominan terpanjang.
- [ ] **Step 3: Latihan kode** satu latihan `js` "Tester kabel LAN": `hasilTester(ujungA: string[], ujungB: string[]): { jenis: "straight" | "crossover" | "salah"; urutanLampu: number[] }`, dengan `ujungA`/`ujungB` berisi 8 nama warna seperti `putih-oranye`. Untuk tiap pin A, `urutanLampu` berisi nomor pin (mulai 1) di ujung B yang berwarna sama, `0` bila warna itu tidak ada di B; `jenis` adalah `straight` bila urutan `[1,2,3,4,5,6,7,8]`, `crossover` bila `[3,6,1,4,5,2,7,8]`, selain itu `salah`. Tes wajib: T568B dengan T568B menghasilkan `straight` dan `[1..8]`; T568A dengan T568B menghasilkan `crossover` dan `[3,6,1,4,5,2,7,8]`; ujung B dengan pin 4 dan 5 bertukar menghasilkan `salah` dan `[1,2,3,5,4,6,7,8]`; ujung B yang kehilangan satu warna (diganti salinan warna lain) menghasilkan `salah` dan memuat `0` tanpa galat. Kode awal tidak boleh lolos.
- [ ] **Step 4:** `npm run draft:check -- jaringan-komputer 38`. Hasil: `OK, siap diimpor`, dan baris bab baru menunjukkan kata dalam 900-1500, kuis 4-5, kode 1.
- [ ] **Step 5: Commit** `git add content/drafts/jaringan-komputer.json && git commit -m "Jaringan Komputer: lab chapter on crimping and testing UTP cable"`

### Task 3: Bab `praktik-router-pertama`

**Files:**
- Modify: `content/drafts/jaringan-komputer.json`

**Interfaces:**
- Produces: bab `praktik-router-pertama`, judul "Praktik: Router MikroTik Pertama dengan Winbox", `est_minutes` 40, `slide_from` 25, `slide_to` 30, ditaruh tepat setelah `infrastruktur-jaringan-modern`. Gambar: `router-5-port`, `kantor-kecil-mikrotik`.

- [ ] **Step 1: Tulis bab**: `## Tujuan`, `## Alat dan Bahan` (router, kabel dari Task 2, laptop, Winbox, catatan stiker sandi), `## Menyambungkan Perangkat` (laptop ke ether2, modem ke ether1), `## Masuk dengan Winbox` (lewat alamat MAC, lalu IP `192.168.88.1`), `## Memeriksa Konfigurasi Bawaan` (perintah `/interface print`, `/ip address print`, `/ip dhcp-client print`, `/ip firewall nat print` beserta arti keluarannya), `## Pengaturan Dasar yang Aman` (`/system identity set name=...`, `/user set admin password=...`, sebut `/system reset-configuration` hanya sebagai jalan keluar dengan peringatan), `## Checklist Hasil`, `## Kalau Tidak Berhasil`, `## Rangkuman`.
- [ ] **Step 2: Kuis skenario** 4 sampai 5 soal, termasuk satu `baca_kode` berisi keluaran `/ip address print` atau `/ip dhcp-client print` dan satu soal tentang alasan mengganti sandi admin; opsi benar tidak dominan terpanjang.
- [ ] **Step 3:** Tanpa latihan kode (`exercises: []`; simulator datang di proyek 3).
- [ ] **Step 4:** `npm run draft:check -- jaringan-komputer 38` hasil `OK, siap diimpor`.
- [ ] **Step 5: Commit** `git add content/drafts/jaringan-komputer.json && git commit -m "Jaringan Komputer: lab chapter on the first MikroTik router with Winbox"`

### Task 4: Bab `praktik-uji-konektivitas`

**Files:**
- Modify: `content/drafts/jaringan-komputer.json`

**Interfaces:**
- Produces: bab `praktik-uji-konektivitas`, judul "Praktik: Menguji Konektivitas dengan Ping dan Traceroute", `est_minutes` 30, `slide_from` 31, `slide_to` 38, ditaruh paling akhir setelah `keamanan-dan-troubleshooting`. Gambar: boleh `kantor-kecil-mikrotik` (maksimal 3).

- [ ] **Step 1: Tulis bab**: `## Tujuan`, `## Tangga Pengujian` (ping gateway, ping IP publik, ping nama; arti tiap hasil), `## Membaca Hasil Ping` (waktu, kehilangan paket, TTL), `## Traceroute` (membaca hop, tanda `*`), `## Praktik di Windows dan di RouterOS` (`ping`, `tracert`, `/ping`, `/tool traceroute`), `## Checklist Hasil`, `## Kalau Tidak Berhasil`, `## Rangkuman`.
- [ ] **Step 2: Kuis skenario** 4 sampai 5 soal, termasuk satu `baca_kode` berisi keluaran ping atau traceroute dan menanyakan hop atau lapisan yang bermasalah; opsi benar tidak dominan terpanjang.
- [ ] **Step 3: Latihan kode** satu latihan `js` "Tangga diagnosa": `lapisMasalah(hasil: { gateway: boolean; ipPublik: boolean; nama: boolean }): "lokal" | "isp" | "dns" | "sehat"`: `lokal` bila `gateway` salah; selain itu `isp` bila `ipPublik` salah; selain itu `dns` bila `nama` salah; selain itu `sehat`. Tes wajib: semua benar `sehat`; hanya `nama` salah `dns`; `ipPublik` dan `nama` salah `isp`; `gateway` salah (apa pun yang lain) `lokal`. Kode awal tidak boleh lolos.
- [ ] **Step 4:** `npm run draft:check -- jaringan-komputer 38` hasil `OK, siap diimpor` dengan 12 bab, dan tanpa masalah bias (Task 1).
- [ ] **Step 5: Commit** `git add content/drafts/jaringan-komputer.json && git commit -m "Jaringan Komputer: lab chapter on ping and traceroute"`

### Task 5: Impor ulang dan terbitkan

**Files:** tidak ada perubahan berkas (data produksi).

- [ ] **Step 1:** Pastikan `git status` bersih dan slot impor tersedia (kurang dari 10 job dalam 24 jam di `import_jobs`). Jalankan `npm run import:manual -- jaringan-komputer` di latar dan tunggu sampai `import_jobs.status` menjadi `done`. Hasil: 12 bab, bukan 9; bila `failed`, hentikan dan laporkan, jangan menerbitkan.
- [ ] **Step 2:** `npm run publish:topic -- jaringan-komputer`. Hasil: `jaringan-komputer terbit`.
- [ ] **Step 3: Verifikasi database** dengan skrip Node sekali jalan: topik berstatus terbit; 12 bab terbit dengan 9 slug lama utuh dan 3 slug baru; soal ujian 40, soal latihan 12; kuis bab tiap bab lama sama dengan draf (periksa dua soal yang teksnya diringkas pada perbaikan bias, mis. "10 link" dan "PAN, jaringan area pribadi" masih ada); 12 latihan kode terbaru termasuk dua latihan baru bila `code_exercises` ikut terbit.
- [ ] **Step 4:** Tunggu build produksi dari git (tanpa `vercel redeploy`, lihat memori `production-state`); karena penerbitan lewat RPC melewati `updateTag`, jalankan satu `npx vercel redeploy lms-ruang-materi.vercel.app --target production` hanya setelah build git terakhir Ready.

### Task 6: Cek di browser

**Files:** tidak ada.

- [ ] **Step 1:** Dengan Playwright (tamu), buka tiga bab baru di 1280px dan 390px: judul benar, gambar termuat, tabel dan checklist tampil, tanpa scroll horizontal.
- [ ] **Step 2:** Jalankan solusi dua latihan baru di editor (cara seperti proyek 1) dan harapkan `Lolos`; klik jawaban benar dan salah per kuis dengan pencocokan teks, harapkan 0 ditolak dan 0 diterima keliru.
- [ ] **Step 3:** Pastikan halaman kelas menampilkan 12 bab berurutan dan bab lama tetap terbuka.
- [ ] **Step 4:** Laporkan ke owner dengan ringkasan dan screenshot satu bab tiap jenis.

## Self-review

- Cakupan spec proyek 2: crimping dan uji kabel (Task 2), router pertama lewat Winbox (Task 3), uji ping/traceroute (Task 4), checklist dan kuis skenario sebagai bukti paham (tiap bab), re-import (Task 5). Bab lab untuk kelas Mikrotik ada di proyek 4.
- Nama konsisten: `longestCorrectShare`, `maxPositionShare`, `BIAS_LIMIT`, `hasilTester`, `lapisMasalah`, tiga slug bab di tugas dan di Review Focus.
- Risiko sisa: kelas penuh 12 bab; kebenaran fakta RouterOS ditinjau saat bab ditulis.
