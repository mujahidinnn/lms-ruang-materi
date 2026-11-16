# Gambar dan Diagram untuk Bab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bab bisa menyisipkan diagram teknis SVG lewat `![ket](gambar:nama)`, dengan 10 diagram jaringan/hardware yang akurat, dipakai di bab Jaringan Komputer.

**Architecture:** SVG dibuat oleh `scripts/praktik.mjs` (data teknis di `lib/praktik/` supaya bisa dites) dan disimpan di `public/praktik/<nama>.svg`. `MarkdownBase` mengenali `gambar:<nama>` seperti `slide:N` dan menampilkannya sebagai `<figure>`. `check-draft` memastikan berkas yang dirujuk ada.

**Tech Stack:** Astro 7, React 19, react-markdown, vitest, Node (skrip .mjs memakai impor .ts seperti `scripts/draft-decks.mjs`), Playwright MCP untuk cek visual.

**Spec:** `docs/superpowers/specs/2026-11-16-praktik-tkj-design.md` (proyek 1 dari 4)

## Global Constraints

- Gaya: kartu putih, garis tinta `#0f100d`, matcha `#e3edc8` dan `#b5d36f`; pink hanya untuk "salah". Hex lain dari `src/styles/globals.css`. Satu pengecualian yang disengaja: warna kabel UTP (oranye, hijau, biru, cokelat) harus warna asli karena itulah isi pelajarannya.
- Tiap SVG punya latar putih sendiri (terbaca di tema gelap), `viewBox`, `width="1200"`, `<title>`, `role="img"`, teks dengan `font-family="system-ui, sans-serif"` (SVG di `<img>` tidak bisa memakai font halaman).
- Tanpa dependensi baru. Teks gambar berbahasa Indonesia. Alamat contoh hanya dari blok dokumentasi (`192.168.x.x`, `203.0.113.0/24`).
- Nama gambar: `^[a-z0-9]+(-[a-z0-9]+)*$`. Maksimal 3 gambar per bab (pilihan Claude).
- Bab tetap lolos `draft:check` (900-1500 kata; baris gambar tidak menambah kata berarti).

## Review Focus

- `gambar:../../x`, `gambar:ABC`, `gambar:a_b` tidak boleh jadi `<img>` (tidak ada penelusuran path).
- Nama valid tapi berkas tidak ada: `check-draft` harus gagal, bukan gambar rusak di produksi.
- `alt` berisi `<script>` tampil sebagai teks, bukan tag.
- SVG tidak boleh memuat `<script>`, `foreignObject`, `on*=`, atau rujukan `http(s)://` selain `xmlns`.
- Tema gelap: gambar tetap terbaca. Mode offline: gambar tetap tampil untuk bab yang sudah dibuka.

---

## File Structure

- `lib/chapters.ts` (ubah): pembantu murni `parseDiagramRef`, `diagramSrc`, `diagramCount`, `missingDiagrams`.
- `components/belajar/MarkdownBase.tsx` (ubah): render `gambar:`.
- `components/belajar/markdown.test.tsx`, `lib/chapters.test.ts` (ubah/baru): tes renderer dan pembantu.
- `lib/praktik/utp.ts` (baru): tabel urutan warna T568A/T568B.
- `lib/praktik/svg.test.ts` (baru): tes tabel UTP dan keamanan/daftar semua SVG.
- `scripts/praktik.mjs` (baru): pembangkit 10 SVG, satu fungsi per gambar.
- `public/praktik/*.svg` (baru, hasil skrip).
- `scripts/check-draft.ts`, `public/sw.js`, `GUIDELINE.md` (ubah).
- `content/drafts/jaringan-komputer.json` (ubah): sisipan gambar di bab.

### Task 1: Renderer `gambar:`

**Files:**
- Modify: `lib/chapters.ts`, `components/belajar/MarkdownBase.tsx`
- Test: `lib/chapters.test.ts` (baru), `components/belajar/markdown.test.tsx`

**Interfaces:**
- Produces (di `lib/chapters.ts`):
  - `parseDiagramRef(src: string): string | null` : nama bila `src` cocok `^gambar:<nama valid>$`, selain itu `null`.
  - `diagramSrc(name: string): string` : `/praktik/${name}.svg`.
  - `diagramCount(body: string): number` : jumlah `](gambar:...)` di body.
  - `missingDiagrams(body: string, exists: (name: string) => boolean): string[]` : nama unik, berurutan muncul, yang dirujuk body tapi `exists` false; nama tidak valid juga dilaporkan.

- [ ] **Step 1: Tulis tes yang gagal.** `lib/chapters.test.ts`: `parseDiagramRef("gambar:utp-t568a-t568b")` = `"utp-t568a-t568b"`; `null` untuk `gambar:../x`, `gambar:ABC`, `gambar:a_b`, `gambar:`, `slide:3`; `diagramSrc("x-y")` = `"/praktik/x-y.svg"`; `diagramCount` menghitung 2 pada body dengan dua rujukan; `missingDiagrams("![a](gambar:ada) ![b](gambar:hilang) ![c](gambar:hilang)", n => n === "ada")` = `["hilang"]`. Di `markdown.test.tsx`: `![Urutan warna](gambar:utp-t568a-t568b)` menghasilkan `src="/praktik/utp-t568a-t568b.svg"` dan `<figcaption>Urutan warna</figcaption>`; `![x](gambar:../../etc/passwd)` dan `![x](gambar:ABC)` tidak menghasilkan `<img`; alt `<script>alert(1)</script>` tidak menghasilkan `<script`; alt kosong menghasilkan `alt="Diagram utp-t568a-t568b"` tanpa `<figcaption>`.
- [ ] **Step 2:** Jalankan `npx vitest run lib/chapters.test.ts components/belajar/markdown.test.tsx`. Hasil: gagal (fungsi belum ada, tes gambar gagal).
- [ ] **Step 3: Implementasi** empat fungsi di `lib/chapters.ts` (regex nama seperti di Global Constraints). Di `MarkdownBase`: `urlTransform` meloloskan `gambar:` seperti `slide:`; di komponen `img`, bila `parseDiagramRef(src)` ada, kembalikan `<figure className="my-5 overflow-hidden rounded-2xl shadow-soft">` berisi `<img loading="lazy" className="h-auto w-full">` dan `<figcaption>` (kelas kecil, warna redup) hanya bila alt tidak kosong; cabang slide yang ada tidak berubah.
- [ ] **Step 4:** Jalankan perintah Step 2 dan `npx vitest run`. Hasil: semua lulus.
- [ ] **Step 5: Commit** `git add lib/chapters.ts lib/chapters.test.ts components/belajar && git commit -m "Chapter bodies can embed diagrams with ![ket](gambar:nama)"`

### Task 2: Kerangka pembangkit dan diagram kabel

**Files:**
- Create: `lib/praktik/utp.ts`, `lib/praktik/svg.test.ts`, `scripts/praktik.mjs`, `public/praktik/utp-t568a-t568b.svg`, `public/praktik/kabel-straight-crossover.svg`, `public/praktik/rj45-konektor.svg`

**Interfaces:**
- Produces:
  - `lib/praktik/utp.ts`: `export const T568A: readonly string[]` dan `T568B` (8 nama warna, indeks 0 = pin 1) dan `export const WIRE_HEX: Record<string, string>`.
  - `scripts/praktik.mjs`: `frame(title: string, height: number, body: string): string` (membungkus kartu putih berukuran 1200 x `height`, `<title>`, `role="img"`), pembantu `text`, `box`, `line`; satu fungsi `gambar<Nama>()` per berkas; menulis semua berkas ke `public/praktik/` saat dijalankan `node scripts/praktik.mjs`.

- [ ] **Step 1: Tulis tes yang gagal** di `lib/praktik/svg.test.ts`: `T568B` = `["putih-oranye","oranye","putih-hijau","biru","putih-biru","hijau","putih-cokelat","cokelat"]`; `T568A` = `["putih-hijau","hijau","putih-oranye","biru","putih-biru","oranye","putih-cokelat","cokelat"]`; pin 4,5,7,8 sama pada keduanya; `EXPECTED` = 10 nama berkas (3 dari task ini, 4 dari Task 3, 3 dari Task 4; tes ini ditandai `test.todo` sampai Task 4 selesai) dan setiap `public/praktik/<nama>.svg` ada (tes ini baru hijau di akhir Task 4); setiap berkas `public/praktik/*.svg` memuat `viewBox`, `<title>`, `role="img"`, dan tidak memuat `<script`, `foreignObject`, ` on\w+=`, atau `https?://` selain `http://www.w3.org/2000/svg`.
- [ ] **Step 2:** `npx vitest run lib/praktik` . Hasil: gagal (modul belum ada).
- [ ] **Step 3: Implementasi** `utp.ts` (data persis seperti tes, plus peta hex warna; strip putih-X digambar dengan garis diagonal putih di atas warna X) dan kerangka `scripts/praktik.mjs` memakai konstanta gaya `scripts/ilustrasi.mjs`. Tiga gambar: `utp-t568a-t568b` (dua baris 8 kabel bernomor pin 1-8, berlabel T568A dan T568B); `kabel-straight-crossover` (dua ujung dan pasangan pin: straight = T568B-T568B atau T568A-T568A, crossover = T568A di satu ujung dan T568B di ujung lain, dengan catatan pin 1,2 bertukar dengan 3,6); `rj45-konektor` (tampak depan, klip menghadap menjauh dari kamu, pin 1 di kiri, pin 1-8 bernomor).
- [ ] **Step 4:** `node scripts/praktik.mjs` lalu `npx vitest run lib/praktik`. Hasil: tes tabel dan keamanan lulus; tes daftar 10 berkas masih `todo` sampai Task 4.
- [ ] **Step 5: Cek visual.** Buka tiap SVG di Playwright (`file:///.../public/praktik/<nama>.svg`), screenshot, baca gambarnya: urutan warna cocok dengan tabel, label terbaca, tidak ada teks terpotong. Perbaiki sampai rapi.
- [ ] **Step 6: Commit** `git add lib/praktik scripts/praktik.mjs public/praktik && git commit -m "Cable diagrams: T568A/B, straight vs crossover, RJ45 pinout"`

### Task 3: Diagram konsep jaringan

**Files:**
- Modify: `scripts/praktik.mjs`
- Create: `public/praktik/topologi-dasar.svg`, `osi-tcpip.svg`, `dhcp-dora.svg`, `nat-masquerade.svg`

**Interfaces:**
- Consumes: `frame`, `text`, `box`, `line` dari Task 2.
- Produces: fungsi `gambarTopologiDasar`, `gambarOsiTcpip`, `gambarDhcpDora`, `gambarNatMasquerade`.

- [ ] **Step 1:** Tambah empat fungsi dan daftarkan ke penulis berkas. Isi wajib: `topologi-dasar` (star, bus, ring, mesh penuh, tree, masing-masing berlabel; mesh penuh 5 perangkat tampak 10 link); `osi-tcpip` (7 lapisan OSI bernomor dari Application=7 sampai Physical=1, dipetakan ke 4 lapisan TCP/IP: Application mencakup OSI 5-7, Transport, Internet, Network Access mencakup OSI 1-2; PDU: Data, Segmen, Paket, Frame, Bit); `dhcp-dora` (klien dan server, empat panah berurutan Discover, Offer, Request, Acknowledge, dengan catatan UDP port 68 klien dan 67 server); `nat-masquerade` (host `192.168.1.10:5000` ke router lalu keluar sebagai `203.0.113.5:40000` ke server `198.51.100.20:443`, plus tabel terjemahan kecil).
- [ ] **Step 2:** `node scripts/praktik.mjs && npx vitest run lib/praktik`. Hasil: tes keamanan lulus untuk berkas baru.
- [ ] **Step 3: Cek visual** seperti Task 2 Step 5. Cocokkan fakta dengan isi bab Jaringan Komputer (nomor lapisan, port DHCP 67/68).
- [ ] **Step 4: Commit** `git add scripts/praktik.mjs public/praktik && git commit -m "Network concept diagrams: topologies, OSI vs TCP/IP, DHCP DORA, NAT"`

### Task 4: Diagram hardware

**Files:**
- Modify: `scripts/praktik.mjs`
- Create: `public/praktik/rak-jaringan.svg`, `router-5-port.svg`, `kantor-kecil-mikrotik.svg`

**Interfaces:**
- Consumes: pembantu Task 2.
- Produces: `gambarRakJaringan`, `gambarRouter5Port`, `gambarKantorKecilMikrotik`.

- [ ] **Step 1:** Tambah tiga fungsi. `rak-jaringan`: rak 19 inci tampak depan dengan, dari atas, patch panel, switch, router, server, UPS di dasar, dengan label "1U" dan kabel patch pendek. `router-5-port`: panel belakang router 5 port umum (ether1 berlabel WAN, ether2-5 LAN, port daya, tombol reset, tanpa model/merek). `kantor-kecil-mikrotik`: ISP/modem -> router (ether1 WAN, ether2 ke switch) -> switch -> PC, laptop, access point, dengan blok jaringan `192.168.88.0/24` dan WAN `203.0.113.5`; ini target proyek akhir kelas Mikrotik.
- [ ] **Step 2:** `node scripts/praktik.mjs && npx vitest run lib/praktik`. Hasil: semua tes lulus, termasuk daftar 10 berkas (hapus `test.todo` dari Task 2).
- [ ] **Step 3: Cek visual** seperti sebelumnya, juga di tema gelap (`prefers-color-scheme: dark` lewat halaman uji atau `browser_emulate_media`).
- [ ] **Step 4: Commit** `git add scripts/praktik.mjs public/praktik lib/praktik && git commit -m "Hardware diagrams: rack, 5-port router, small office with a Mikrotik"`

### Task 5: Validasi draf, offline, dokumentasi

**Files:**
- Modify: `scripts/check-draft.ts`, `public/sw.js`, `GUIDELINE.md`

**Interfaces:**
- Consumes: `diagramCount`, `missingDiagrams` dari Task 1.

- [ ] **Step 1:** Di `scripts/check-draft.ts`, per bab: `missingDiagrams(c.body, (n) => existsSync(\`public/praktik/${n}.svg\`))` bila tidak kosong menambah masalah `bab N: gambar tidak ada: ...`; `diagramCount(c.body) > 3` menambah masalah `maksimal 3 gambar`.
- [ ] **Step 2:** Di `public/sw.js`, jalur `/praktik/` ikut `cacheFirst` bersama `/_astro/` dan `/icons/`.
- [ ] **Step 3:** Di `GUIDELINE.md`, pada bagian yang menjelaskan sisipan `slide:N`, tambahkan `gambar:<nama>` (lokasi berkas, pembangkit `node scripts/praktik.mjs`, batas 3 per bab, `check-draft` memeriksa keberadaan).
- [ ] **Step 4: Verifikasi negatif.** Salin draf sementara dengan satu rujukan `gambar:tidak-ada`, jalankan `npm run draft:check -- <slug> 38` pada salinan itu (ganti nama berkas sementara), hasil harus `MASALAH` berisi `gambar tidak ada`; hapus salinan.
- [ ] **Step 5: Commit** `git add scripts/check-draft.ts public/sw.js GUIDELINE.md && git commit -m "check-draft verifies diagram files; service worker caches them"`

### Task 6: Pasang di Jaringan Komputer dan rilis

**Files:**
- Modify: `content/drafts/jaringan-komputer.json`

- [ ] **Step 1:** Sisipkan baris gambar (satu baris, di bawah bagian yang menjelaskannya, dengan keterangan Indonesia) pada bab: `jenis-dan-topologi` -> `topologi-dasar`; `model-osi-dan-tcp-ip` -> `osi-tcpip`; `perangkat-dan-media-transmisi` -> `utp-t568a-t568b`, `kabel-straight-crossover`, `rj45-konektor`; `ipv6-port-dns-dhcp-nat` -> `dhcp-dora`, `nat-masquerade`; `infrastruktur-jaringan-modern` -> `rak-jaringan`. `router-5-port` dan `kantor-kecil-mikrotik` belum dipasang (dipakai proyek 2 dan 4).
- [ ] **Step 2:** `npm run draft:check -- jaringan-komputer 38`. Hasil: `OK, siap diimpor`.
- [ ] **Step 3: Sinkronkan ke database** tanpa impor ulang: skrip Node sekali jalan (service role, `.env.local`) yang untuk tiap bab di atas menjalankan `update chapters set body = <body draf> where topic_id = <topik jaringan-komputer> and slug = <slug bab>`; hasil harus tepat 1 baris per bab.
- [ ] **Step 4:** `git add content/drafts/jaringan-komputer.json && git commit && git push`, lalu `npx vercel redeploy lms-ruang-materi.vercel.app --target production`.
- [ ] **Step 5: Cek browser** di produksi dengan Playwright: tiap bab di Step 1 menampilkan gambarnya (`img` termuat, `naturalWidth > 0`), tidak ada scroll horizontal di 390px, tema gelap terbaca, dan bab yang sudah dibuka tetap menampilkan gambar saat browser offline (`browser_evaluate` dengan `context.setOffline` atau DevTools offline).
- [ ] **Step 6:** Laporkan ke owner dengan screenshot tiap gambar untuk ditinjau akurasinya.

## Self-review

- Cakupan spec proyek 1: renderer (Task 1), ~10 gambar (Task 2-4), validasi, offline, dokumentasi (Task 5), pemakaian di bab (Task 6). Pemakaian di kelas Mikrotik dan bab lab ada di proyek 2 dan 4.
- Nama konsisten: `parseDiagramRef`, `diagramSrc`, `diagramCount`, `missingDiagrams`, `frame`, 10 nama berkas yang sama di tes, skrip, dan Task 6.
- Panjang: rencana lebih pendek dari kodenya nanti; badan fungsi tidak ditulis.
