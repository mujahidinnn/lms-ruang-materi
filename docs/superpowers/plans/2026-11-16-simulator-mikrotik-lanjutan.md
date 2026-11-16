# Perluasan Simulator MikroTik (4a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Interpreter `mikrotik` mengenal perintah yang dibutuhkan kelas MikroTik gaya MTCNA: bridge, DHCP lease statis, ARP, rute dengan distance dan flag, firewall filter, address-list, queue sederhana, layanan, dan pengguna; ditambah beberapa perbaikan kecil yang tertunda dari proyek 3.

**Architecture:** Semua perubahan di satu fungsi swa-cukup `routerOSShim` (`lib/code/routeros.ts`): tipe `RouterState` diperluas, tabel `SPECS` dan `switch` diberi perintah baru, tabel `shapes` untuk `awal` diberi nilai bawaan agar `awal` lama tetap valid. Tidak ada perubahan di sandbox, skema, UI, atau DB.

**Tech Stack:** TypeScript, vitest.

**Spec:** `docs/superpowers/specs/2026-11-16-kelas-mikrotik-design.md` (proyek 4a). Pola dan konvensi mengikuti `docs/superpowers/plans/2026-11-16-praktik-simulator-mikrotik.md`.

## Global Constraints

- `routerOSShim` tetap **satu fungsi swa-cukup**: tanpa impor, tanpa merujuk nilai di luar fungsinya (sumbernya disuntikkan lewat `.toString()`). Jangan memecahnya ke modul; berkas boleh membesar.
- Tanpa dependensi baru. Skrip murid tetap hanya data. Batas lama tetap: 200 baris, 2000 karakter per baris, `/ping` count 1 sampai 20.
- Argumen baru masuk daftar `keys` per perintah; `__proto__`, `constructor`, dan `prototype` tetap ditolak sebagai argumen untuk semua perintah baru; argumen tak dikenal tetap `expected end of command (line N column M)`; token posisional berlebih tetap `expected end of command`.
- Pesan galat: pasti sama dengan RouterOS hanya `bad command name`, `failure: already have such address`, `input does not match any value of <argumen>`, `failure: already have interface with such name`, `failure: already have such name`. Semua pesan lain di rencana ini adalah **pendekatan**, dan GUIDELINE harus menyebutnya demikian.
- Perilaku lama tidak boleh berubah kecuali yang tertulis eksplisit di Task 1; seluruh tes lama (135 di suite) tetap hijau; `npm run draft:check -- jaringan-komputer 38` tetap `OK, siap diimpor` (dua latihan simulator di bab router tetap lolos).
- Tes baru di berkas baru `lib/code/routeros-lanjutan.test.ts` (pakai `routerOSShim().jalankanRouterOS`); tes lama di `routeros.test.ts` hanya diubah bila bentuk state berubah (Task 1).

## Review Focus

- Entri `awal` lama tanpa field baru (`interfaces` tanpa `arp`, `routes` tanpa `distance`) tetap diterima dengan nilai bawaan; entri bertipe salah tetap dibuang tanpa melempar.
- Kunci state baru tanpa entri `shapes` atau tanpa contoh di tes drift harus membuat tes gagal.
- Perintah baru dengan `__proto__=x`, `constructor=x`, nilai diapit tanda kutip berisi spasi, nilai kosong `name=`, dan baris panjang tidak melempar galat dan tidak mencemari prototipe.
- Skrip yang menambah ratusan entri (batas 200 baris) tidak menggantung dan keluaran `print` tetap rapi.
- `/ip service set` dan `/interface ethernet set` mengambil tepat satu token posisional; semua `add` baru nol.

---

## File Structure

- `lib/code/routeros.ts` (ubah): tipe, `initial`, `SPECS`, `PRINTS`, `shapes`, `switch`.
- `lib/code/routeros-lanjutan.test.ts` (baru): tes perintah baru dan tes drift.
- `lib/code/routeros.test.ts` (ubah seperlunya): bentuk state `interfaces` dan `routes` bertambah field.
- `GUIDELINE.md` (ubah): entri jenis `mikrotik`.

### Task 1: Fondasi state, ARP, rute, dan perbaikan kecil

**Files:**
- Modify: `lib/code/routeros.ts`, `lib/code/routeros.test.ts`
- Create: `lib/code/routeros-lanjutan.test.ts`

**Interfaces:**
- Produces: `RouterState` baru (kunci lama tetap; perubahan bertanda):
  `interfaces: { name: string; running: boolean; arp: string }[]` (**arp** baru, bawaan `"enabled"`), `routes: { dstAddress: string; gateway: string; distance: number }[]` (**distance** baru, bawaan `1`), dan kunci array baru yang dipakai task berikutnya, semua awalnya `[]`: `bridges: { name: string }[]`, `bridgePorts: { bridge: string; interface: string }[]`, `dhcpLeases: { address: string; macAddress: string; server: string }[]`, `arp: { address: string; macAddress: string; interface: string }[]`, `filter: { chain: string; action: string; protocol: string; dstPort: string; srcAddress: string; inInterface: string; connectionState: string }[]`, `addressLists: { list: string; address: string }[]`, `queues: { name: string; target: string; maxLimit: string }[]`; serta `services: { name: string; port: number; disabled: boolean }[]` bawaan `telnet 23, ftp 21, www 80, ssh 22, www-ssl 443 (disabled true), api 8728, winbox 8291, api-ssl 8729 (semua disabled false kecuali www-ssl dan api-ssl true)` dan `users: { name: string; group: string }[]` bawaan `[{ name: "admin", group: "full" }]`.

Perubahan perilaku di task ini:
1. `hasIf` (interface yang sah untuk `interface=`, `in-interface=`) menerima nama interface fisik **dan** nama bridge (`state.bridges`).
2. `awal`: tabel `shapes` mendukung nilai bawaan per field: entri yang tidak punya field berbawaan (`arp`, `distance`) diterima dan diisi bawaan; field berbawaan bertipe salah membuang entri. Kunci `services` dan `users` memakai `shapes` (field `port` number, `disabled` boolean, `name` dan `group` string).
3. `comment=<teks>` diterima dan **diabaikan** pada semua perintah `add`.
4. Satu baris kosong di akhir skrip tidak dihitung ke batas 200 baris.
5. `/interface ethernet set <nama> arp=<enabled|disabled|proxy-arp|local-proxy-arp|reply-only>`: tepat satu posisional (nama interface fisik; bukan nama bridge atau tak dikenal: `no such item`), `arp` wajib, nilai di luar daftar: `input does not match any value of arp`; `/interface ethernet print` kolom `NAME, ARP`.
6. `/ip arp add address=<ip> mac-address=<mac> interface=<nama>` (alamat tidak valid: `invalid value for argument address`; MAC harus 6 pasang heksadesimal dipisah `:`, selain itu `invalid value for argument mac-address`; interface tak dikenal: `input does not match any value of interface`; alamat dan interface sama sudah ada: `failure: already have such entry` (pendekatan)); `/ip arp print` kolom `ADDRESS, MAC-ADDRESS, INTERFACE`.
7. `/ip route add dst-address=<cidr> gateway=<ip atau nama interface> [distance=1..255]`: `dst-address` tidak valid `invalid value for argument dst-address`; `gateway` bukan IPv4 dan bukan nama interface/bridge `invalid value for argument gateway`; `distance` bukan bilangan bulat 1 sampai 255 `invalid value for argument distance`; bawaan 1. `/ip route print` kolom `FLAGS, DST-ADDRESS, GATEWAY, DISTANCE`: baris statik (dari state) berflag `AS`, diikuti satu baris turunan per alamat router berflag `DAc` dengan `DST-ADDRESS` = `<network>/<prefix>`, `GATEWAY` = nama interface, `DISTANCE` = `0` (baris turunan tidak masuk `router.routes`).
8. `/ip dhcp-server` dan perintah lain yang sudah ada tidak berubah.

- [ ] **Step 1: Tulis tes yang gagal.** Di `routeros-lanjutan.test.ts`: nilai bawaan state (`interfaces[0].arp === "enabled"`, `services` berisi 8 entri dengan `www-ssl` dan `api-ssl` `disabled`, `users` berisi admin `full`); `awal` dengan `interfaces: [{ name: "ether1", running: true }]` (tanpa `arp`) diterima dan `arp` terisi `"enabled"`, dengan `routes: [{ dstAddress: "0.0.0.0/0", gateway: "10.0.0.1" }]` terisi `distance 1`, dengan `arp: 5` pada entri membuangnya; `/ip address add ... interface=bridge1` setelah `bridges` berisi `bridge1` (lewat `awal`) diterima dan sebelum itu ditolak; `comment="x y"` pada `/ip address add` diterima tanpa efek dan tanpa galat; skrip 200 perintah ditambah satu newline di akhir berjalan (bukan `script too long`) dan 201 perintah ditolak; `/interface ethernet set ether2 arp=reply-only` mengubah state, `arp=foo` dan `set ether9 arp=disabled` dan `set bridge1 ...` memberi galat yang tepat, `set arp=disabled` (tanpa nama) memberi `failure: missing required argument name`; `/ip arp add` valid dan semua galatnya; `/ip route add` dengan distance, tanpa distance, dengan `gateway=ether1`, dan semua galatnya; `/ip route print` pada router dengan satu alamat `192.168.88.1/24` di `ether2` dan satu rute statik berisi baris `AS` lalu baris `DAc 192.168.88.0/24 ether2 0`; tes drift: untuk setiap kunci bertipe array di `jalankanRouterOS("").router`, tabel contoh di tes (satu entri valid per kunci) dilewatkan sebagai `awal` dan hasilnya mempertahankan entri itu, dan tes gagal bila ada kunci array state yang tidak punya contoh di tabel tes (mendeteksi kunci baru yang lupa `shapes`).
- [ ] **Step 2:** `npx vitest run lib/code/routeros-lanjutan.test.ts lib/code/routeros.test.ts`. Hasil: gagal pada tes baru; tes lama yang memeriksa bentuk `interfaces` atau `routes` ikut gagal dan diperbarui di langkah berikutnya.
- [ ] **Step 3: Implementasi** semua perubahan di atas di `routeros.ts`. Perbarui tes lama di `routeros.test.ts` yang membandingkan bentuk `interfaces`/`routes` dengan `toEqual` agar memuat `arp` dan `distance`.
- [ ] **Step 4:** `npx vitest run` (suite penuh) dan `npm run draft:check -- jaringan-komputer 38`. Hasil: hijau dan `OK, siap diimpor`.
- [ ] **Step 5: Commit** `git add lib/code && git commit -m "RouterOS simulator: ARP, route distance and flags, bridges as interfaces, comment, awal defaults, drift test"`

### Task 2: Bridge dan DHCP lease statis

**Files:**
- Modify: `lib/code/routeros.ts`, `lib/code/routeros-lanjutan.test.ts`

**Interfaces:**
- Consumes: kunci state `bridges`, `bridgePorts`, `dhcpLeases` dan `hasIf` dari Task 1.
- Produces perintah:
  - `/interface bridge add name=<n>`: `name` wajib; nama yang sama dengan bridge atau interface yang ada: `failure: already have interface with such name`. `/interface bridge print` kolom `NAME`.
  - `/interface bridge port add bridge=<b> interface=<i>`: bridge tak ada `input does not match any value of bridge`; interface bukan interface fisik (tak dikenal atau nama bridge) `input does not match any value of interface`; interface itu sudah menjadi port bridge mana pun `failure: device already added as bridge port` (pendekatan). `/interface bridge port print` kolom `BRIDGE, INTERFACE`.
  - `/ip dhcp-server lease add address=<ip> mac-address=<mac> [server=<nama>]`: `address` tidak valid `invalid value for argument address`; `mac-address` tidak valid `invalid value for argument mac-address`; `server` diberikan tapi tak ada `input does not match any value of server`; `address` sama sudah ada atau `mac-address` sama sudah ada `failure: already have such entry` (pendekatan; MAC dibandingkan tanpa membedakan huruf besar kecil). `/ip dhcp-server lease print` kolom `ADDRESS, MAC-ADDRESS, SERVER`.

- [ ] **Step 1: Tulis tes yang gagal** untuk tiap perintah: kasus berhasil (state tepat), semua galat di atas, bridge bernama sama dengan `ether1` ditolak, MAC huruf kecil dan besar dianggap sama untuk duplikat, `server` kosong diterima, `print` memuat baris yang benar, argumen tak dikenal dan `__proto__=x` ditolak, `comment="a b"` diterima, `add` dengan token posisional berlebih ditolak.
- [ ] **Step 2:** `npx vitest run lib/code/routeros-lanjutan.test.ts`. Hasil: gagal pada tes baru.
- [ ] **Step 3: Implementasi** di `SPECS`, `PRINTS` (path `interface bridge`, `interface bridge port`, `ip dhcp-server lease` memakai awalan terpanjang yang sudah ada), dan `switch`.
- [ ] **Step 4:** `npx vitest run`. Hasil: hijau.
- [ ] **Step 5: Commit** `git add lib/code && git commit -m "RouterOS simulator: bridge, bridge ports, static DHCP leases"`

### Task 3: Firewall filter, address-list, queue, layanan, pengguna

**Files:**
- Modify: `lib/code/routeros.ts`, `lib/code/routeros-lanjutan.test.ts`

**Interfaces:**
- Consumes: kunci state `filter`, `addressLists`, `queues`, `services`, `users` dari Task 1.
- Produces perintah:
  - `/ip firewall filter add chain=<input|forward|output> action=<accept|drop|reject|passthrough|log> [protocol=<tcp|udp|icmp>] [dst-port=<angka|a-b|daftar dipisah koma, 1-65535>] [src-address=<ip|cidr>] [in-interface=<nama>] [connection-state=<daftar dipisah koma dari established,related,new,invalid,untracked>]`. `chain` dan `action` wajib. Galat: `input does not match any value of chain`, `... of action`, `... of protocol`; `dst-port` tanpa `protocol` tcp atau udp `failure: protocol tcp or udp required for dst-port` (pendekatan); `dst-port` tidak valid `invalid value for argument dst-port`; `src-address` tidak valid `invalid value for argument src-address`; `in-interface` tak dikenal `input does not match any value of in-interface`; token `connection-state` tak dikenal `invalid value for argument connection-state`. Urutan aturan dipertahankan (atas ke bawah). `print` kolom `CHAIN, ACTION, PROTOCOL, DST-PORT, SRC-ADDRESS, IN-INTERFACE, CONNECTION-STATE` (kosong bila tidak diisi).
  - `/ip firewall address-list add list=<nama> address=<ip|cidr>`: keduanya wajib; alamat tidak valid `invalid value for argument address`; pasangan list dan address yang sama sudah ada `failure: already have such entry` (pendekatan). `print` kolom `LIST, ADDRESS`.
  - `/queue simple add name=<n> target=<ip|cidr> [max-limit=<unggah>/<unduh>]`: `name` dan `target` wajib; `target` tidak valid `invalid value for argument target`; `max-limit` harus cocok `angka` diikuti `k`, `M`, atau `G` opsional, garis miring, lalu hal serupa (contoh `2M/10M`, `512k/1M`, `0/0`), selain itu `invalid value for argument max-limit`; nama sama sudah ada `failure: already have such name`. `print` kolom `NAME, TARGET, MAX-LIMIT`.
  - `/ip service print` kolom `FLAGS, NAME, PORT` (flag `X` untuk disabled); `/ip service set <nama> [disabled=<yes|no>] [port=<1-65535>]`: tepat satu posisional; nama tak ada `no such item`; `disabled` bukan yes/no `invalid value for argument disabled`; `port` bukan bilangan bulat 1 sampai 65535 `invalid value for argument port`.
  - `/user add name=<n> password=<teks> group=<read|write|full>`: `name` dan `group` wajib (lebih ketat dari RouterOS, didokumentasikan); `group` di luar daftar `input does not match any value of group`; nama sama sudah ada `failure: user with the same name already exists` (pendekatan); `password` diterima tetapi **tidak disimpan** di state. `/user print` kolom `NAME, GROUP`.

- [ ] **Step 1: Tulis tes yang gagal** untuk tiap perintah: berhasil (state tepat), semua galat, aturan filter beruntun (urutan dan `print`), `dst-port` bentuk `80`, `8000-8100`, `80,443`, `0`, `65536`, `a`; `connection-state=established,related` valid dan `established,foo` tidak; `max-limit` `2M/10M`, `512k/1M`, `0/0` valid dan `2M`, `M/2M`, `2X/2M` tidak; `/ip service set telnet disabled=yes` mengubah state dan `set telnet` tanpa argumen apa pun diterima tanpa efek, `set foo disabled=yes` memberi `no such item`, `set disabled=yes` memberi `failure: missing required argument name`; `/user add` tidak menyimpan password (`JSON.stringify(router)` tidak memuat kata sandi yang diberikan); `__proto__=x` dan argumen tak dikenal ditolak di semua perintah baru; `comment` diterima.
- [ ] **Step 2:** `npx vitest run lib/code/routeros-lanjutan.test.ts`. Hasil: gagal pada tes baru.
- [ ] **Step 3: Implementasi** di `routeros.ts`.
- [ ] **Step 4:** `npx vitest run` dan `npm run lint` (galat lama 20 tidak bertambah) dan `npm run draft:check -- jaringan-komputer 38`. Hasil: hijau, 20, dan `OK, siap diimpor`.
- [ ] **Step 5: Commit** `git add lib/code && git commit -m "RouterOS simulator: firewall filter, address lists, simple queues, services, users"`

### Task 4: Dokumentasi dan pemeriksaan akhir

**Files:**
- Modify: `GUIDELINE.md`

- [ ] **Step 1:** Perbarui entri jenis `mikrotik` di GUIDELINE: daftar perintah lengkap (lama dan baru), bentuk `router` baru (semua kunci), nilai bawaan (`interfaces` dengan `arp`, `services`, `users`), aturan `awal` (field berbawaan boleh dihilangkan), `comment=` diabaikan, bridge sebagai interface sah, daftar tepat pesan yang pasti sama dengan RouterOS dan pernyataan bahwa selebihnya pendekatan, dan bahwa `/user add` tidak menyimpan password dan mewajibkan `group`.
- [ ] **Step 2:** `npx vitest run`, `npm run check`, `npm run lint`, `npm run draft:check -- jaringan-komputer 38`; lalu `npx playwright test e2e/sandbox.e2e.ts -g mikrotik` bila lingkungan mengizinkan (laporkan bila tidak). Hasil: semuanya hijau, lint tetap 20.
- [ ] **Step 3: Commit dan rilis.** `git add GUIDELINE.md && git commit -m "GUIDELINE: extended MikroTik simulator commands"`, lalu `git push` dan tunggu build git Ready. Tidak ada impor atau publish (tidak ada perubahan konten). Setelah Ready, cek singkat di produksi dengan Playwright (tamu): di bab `praktik-router-pertama` solusi kedua latihan masih `Lolos`.

## Self-review

- Cakupan spec 4a: bridge dan port, lease statis, filter dengan connection-state dan address-list, queue simple, layanan dan pengguna, ARP dan flag rute (Task 1-3), dokumentasi dan GUIDELINE (Task 4), tambah tertunda dari proyek 3: `comment`, newline akhir, tes drift `shapes`.
- Nama konsisten: `RouterState` kunci `bridges`, `bridgePorts`, `dhcpLeases`, `arp`, `filter`, `addressLists`, `queues`, `services`, `users`, `hasIf`, `shapes`, `SPECS`.
- Risiko sisa: kebenaran sintaks RouterOS ditinjau di ulasan akhir; kelas 4b mengandalkan perintah ini, jadi ulasan akhir juga memeriksa bahwa daftar perintah cukup untuk modul MTCNA yang direncanakan.
