# Simulator Terminal MikroTik Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jenis latihan kode baru `mikrotik`: murid mengetik perintah RouterOS di editor, tombol Jalankan menampilkan keluaran seperti terminal, dan Periksa mengevaluasi ekspresi JavaScript atas state router tiruan. Dua latihan pertama dipasang di bab `praktik-router-pertama`.

**Architecture:** Satu fungsi murni swa-cukup `routerOSShim()` (pola `expressShim`) memuat penerjemah perintah. Ia disuntikkan sebagai `shim` ke mesin `js` yang sudah ada, baik di sandbox browser (`buildSandboxDoc`) maupun di validator server (`runChecksNode`), sehingga tes latihan dijalankan oleh mesin yang sama. Skrip murid hanya data (JSON), tidak pernah menjadi kode. Pola penambahan jenis mengikuti commit `f154976` (python): daftar jenis di enum zod, enum DB, editor admin, `RUNNABLE`, `counted_exercise`, `CodeExercise`.

**Tech Stack:** TypeScript, vitest, Astro/React, Supabase migrations, Playwright MCP.

**Spec:** `docs/superpowers/specs/2026-11-16-praktik-tkj-design.md` (proyek 3 dari 4).

## Global Constraints

- Tanpa dependensi baru. `routerOSShim` harus **swa-cukup** (tanpa impor, tanpa merujuk nilai di luar fungsinya) karena sumbernya disuntikkan lewat `.toString()`, seperti `expressShim` dan `sandboxEngine`.
- Subset perintah persis daftar di Task 1; perintah lain menghasilkan galat, bukan diam-diam diabaikan. Pesan galat dalam bahasa Inggris seperti RouterOS asli; yang pasti sama dengan RouterOS: `bad command name`, `failure: already have such address`, `input does not match any value of <argumen>`. Pesan lain mendekati dan didokumentasikan sebagai pendekatan di GUIDELINE.
- Skrip murid tidak boleh dieksekusi sebagai JavaScript: ia dimasukkan sebagai literal JSON. Di HTML, `<` di-escape (fungsi `embed` yang ada).
- Batas: skrip maksimal 200 baris dan 2000 karakter per baris; `/ping` `count` 1 sampai 20.
- Bahasa UI Indonesia; nama label editor "Editor terminal"; keluaran tampil di panel keluaran yang ada.
- Semua jenis lama (`web`, `js`, `express`, `python`) berperilaku sama; suite penuh dan `npm run lint` hijau.

## Review Focus

- Skrip berisi `</script>`, backtick, `${...}`, `__proto__=x`, `constructor`, atau 10.000 baris tidak boleh merusak harness, mencemari prototipe, atau menggantung.
- `/ping 192.168.88.1 count=999999` ditolak; tidak ada keluaran tak terbatas.
- Alamat tidak valid: `192.168.88.1/33`, `300.1.1.1/24`, `192.168.88.1` tanpa prefix, dan alamat ganda pada interface sama.
- `awal` (state awal dari `setup`) bertipe salah tidak boleh melempar galat tak terjelaskan.
- Latihan `mikrotik` yang tes-nya kosong tidak dihitung (aturan `counted_exercise`), dan bab dengan latihan baru hanya selesai bila semuanya lolos.

---

## File Structure

- `lib/code/routeros.ts` (baru): `routerOSShim`, tipe `RouterState`.
- `lib/code/mikrotik.ts` (baru): `mikrotikCode(script)`, pembungkus yang dipakai sandbox dan validator.
- `lib/code/routeros.test.ts`, `lib/code/mikrotik.test.ts` (baru).
- `lib/code/sandbox-doc.ts`, `lib/code/check-node.ts` (ubah): jenis baru.
- `worker/prompt.ts`, `lib/content.ts`, `lib/actions/admin-latihan-kode.ts`, `lib/actions/admin-proyek.ts`, `components/admin/ExerciseEditor.tsx`, `components/admin/ProjectEditor.tsx`, `components/code/CodeExercise.tsx`, `components/code/CodeEditor.tsx` (ubah).
- `supabase/migrations/20261116010000_code_kind_mikrotik.sql`, `20261116020000_counted_exercise_mikrotik.sql` (baru; dua berkas karena nilai enum baru tidak bisa dipakai di transaksi yang menambahkannya).
- `content/drafts/jaringan-komputer.json`, `GUIDELINE.md`, `e2e/sandbox.e2e.ts` (ubah).

### Task 1: Penerjemah RouterOS

**Files:**
- Create: `lib/code/routeros.ts`, `lib/code/routeros.test.ts`

**Interfaces:**
- Produces (di `lib/code/routeros.ts`):
  - `type RouterState = { identity: string; interfaces: { name: string; running: boolean }[]; addresses: { address: string; network: string; interface: string }[]; pools: { name: string; ranges: string }[]; dhcpServers: { name: string; interface: string; addressPool: string }[]; dhcpNetworks: { address: string; gateway: string; dnsServer: string }[]; nat: { chain: string; action: string; outInterface: string; srcAddress: string }[]; routes: { dstAddress: string; gateway: string }[]; dns: { servers: string[]; allowRemoteRequests: boolean } }`
  - `routerOSShim(): { jalankanRouterOS: (script: string, awal?: Partial<RouterState>) => { router: RouterState; keluaran: string[] } }`
- State awal bawaan: `identity "MikroTik"`, `interfaces` ether1 sampai ether5 semua `running: true`, semua daftar lain kosong, `dns { servers: [], allowRemoteRequests: false }`. `awal` menimpa tingkat atas; nilai bertipe salah diabaikan.
- Aturan baris: kosong dan baris berawalan `#` diabaikan; ` \` di akhir baris menyambung ke baris berikut; kata dipisah spasi; `kunci=nilai`, nilai boleh diapit tanda kutip ganda; jalur boleh `/ip address add` atau `/ip/address/add`. Tiap baris perintah menambah satu baris gema `[admin@<identity>] > <perintah>` ke `keluaran`, lalu keluarannya. Galat satu baris tidak menghentikan baris berikutnya.
- Perintah dan galat (tepat ini):
  - `/system identity set name=X`; `/system identity print` mencetak `name: X`.
  - `/interface print`: tabel `NAME`, `TYPE` (selalu `ether`), bendera `R` untuk running.
  - `/ip address add address=<ip>/<prefix> interface=<nama>`: menghitung `network` dari alamat dan prefix; `print` kolom `ADDRESS, NETWORK, INTERFACE`; `remove <nomor>` menghapus berdasarkan nomor baris cetak, nomor tak ada menghasilkan `no such item`. Galat: interface tidak ada `input does not match any value of interface`; alamat tidak valid (oktet di atas 255, prefix di luar 0-32, tanpa prefix) `invalid value for argument address`; alamat dan interface sama sudah ada `failure: already have such address`.
  - `/ip pool add name=X ranges=<a>-<b>`; `print`.
  - `/ip dhcp-server add name=X interface=Y address-pool=Z`: pool tidak ada `input does not match any value of address-pool`, interface tidak ada `input does not match any value of interface`; `print`. `/ip dhcp-server network add address=<cidr> gateway=<ip> dns-server=<ip>`; `print`.
  - `/ip firewall nat add chain=<srcnat|dstnat> action=<accept|masquerade|dst-nat|src-nat> [out-interface=<nama>] [src-address=<cidr>]`: chain atau action di luar daftar `input does not match any value of chain` atau `... of action`; `print`.
  - `/ip route add dst-address=<cidr> gateway=<ip>`; `print`.
  - `/ip dns set servers=<ip,ip> allow-remote-requests=<yes|no>`; `print`.
  - `/ping <ip> [count=N]`: tiap balasan satu baris `<ip> 56 64 1ms`; berhasil bila ip adalah salah satu alamat router, atau berada di jaringan (`network`) milik salah satu alamat router, atau ada rute yang `dstAddress`-nya mencakup ip (rute bawaan `0.0.0.0/0` mencakup semua); selain itu tiap baris `timeout`. Penutup `sent=N received=M packet-loss=P%`.
  - Perintah tidak dikenal: `bad command name <kata> (line <n> column <m>)`. Argumen tak dikenal pada `add` atau `set`: `expected end of command (line <n> column <m>)`. Argumen wajib hilang: `failure: missing required argument <nama>` (pendekatan, bukan teks RouterOS asli).
  - Skrip lebih dari 200 baris atau baris lebih dari 2000 karakter menghasilkan satu baris `script too long` tanpa menjalankan apa pun; `count` di luar 1 sampai 20 menghasilkan `invalid value for argument count`.
- Parameter disimpan di objek tanpa prototipe; `__proto__`, `constructor`, dan `prototype` sebagai nama argumen diperlakukan sebagai argumen tak dikenal.

- [ ] **Step 1: Tulis tes yang gagal** di `lib/code/routeros.test.ts` (pakai `routerOSShim().jalankanRouterOS`). Wajib: `/system identity set name=R-Kantor` menghasilkan `router.identity === "R-Kantor"`; `/ip address add address=192.168.88.1/24 interface=ether2` menghasilkan satu alamat dengan `network === "192.168.88.0"` (dan `192.168.88.130/26` menghasilkan `192.168.88.128`); alamat yang sama dua kali menghasilkan baris `failure: already have such address` dan tetap satu alamat; `interface=ether9` menghasilkan `input does not match any value of interface`; `192.168.88.1/33`, `300.1.1.1/24`, dan `192.168.88.1` menghasilkan `invalid value for argument address`; `remove 0` menghapus dan `remove 5` menghasilkan `no such item`; pool, dhcp-server (pool tidak ada ditolak), network, nat (`chain=foo` ditolak, `chain=srcnat action=masquerade out-interface=ether1` diterima), route, dns masing-masing menambah state yang benar; gaya `/ip/address/add` dan sambungan ` \` memberi hasil sama dengan satu baris; baris `#` dan kosong diabaikan; satu baris salah tidak menghentikan baris berikutnya; `/ping` ke alamat sendiri menghasilkan `received=4` untuk `count=4`, ke `8.8.8.8` tanpa rute menghasilkan `packet-loss=100%`, ke `8.8.8.8` dengan rute `0.0.0.0/0` menghasilkan `packet-loss=0%`, `count=999999` menghasilkan `invalid value for argument count`; `foo bar` menghasilkan `bad command name foo (line 1 column 1)`; `/ip address add address=192.168.88.1/24 interface=ether2 __proto__=x` menghasilkan `expected end of command` dan `({}).x` tetap `undefined` setelahnya; skrip 201 baris menghasilkan `script too long`; `awal` dengan `identity: "R1"` dipakai dan `awal` dengan `identity: 5` diabaikan; gema `[admin@R1] > ...` memakai identitas terkini.
- [ ] **Step 2:** `npx vitest run lib/code/routeros.test.ts`. Hasil: gagal (modul belum ada).
- [ ] **Step 3: Implementasi** `routerOSShim` di `lib/code/routeros.ts`, swa-cukup, tanpa dependensi; tabel `print` memakai spasi tetap sehingga tes memeriksa substring, bukan lebar kolom.
- [ ] **Step 4:** `npx vitest run lib/code/routeros.test.ts`. Hasil: semua lulus. Tambahkan tes bahwa `routerOSShim.toString()` dievaluasi tersendiri (`new Function("return (" + src + ")()")`) berfungsi, untuk membuktikan swa-cukup.
- [ ] **Step 5: Commit** `git add lib/code/routeros.ts lib/code/routeros.test.ts && git commit -m "RouterOS command interpreter for the MikroTik simulator"`

### Task 2: Jenis `mikrotik` di sandbox, validator, dan skema

**Files:**
- Create: `lib/code/mikrotik.ts`, `lib/code/mikrotik.test.ts`, kedua migrasi
- Modify: `lib/code/sandbox-doc.ts`, `lib/code/check-node.ts`, `worker/prompt.ts`, `lib/content.ts`, `lib/actions/admin-latihan-kode.ts`, `lib/actions/admin-proyek.ts`, `components/admin/ExerciseEditor.tsx`, `components/admin/ProjectEditor.tsx`, `components/code/CodeExercise.tsx`, `components/code/CodeEditor.tsx`

**Interfaces:**
- Consumes: `routerOSShim` dari Task 1.
- Produces:
  - `mikrotikCode(script: string): string` di `lib/code/mikrotik.ts`: kode JavaScript yang menjalankan `jalankanRouterOS(<script sebagai literal JSON>, typeof awal === "undefined" ? undefined : awal)`, mendefinisikan `router` dan `keluaran` untuk tes, dan memanggil `console.log` untuk tiap baris `keluaran`. `setup` latihan boleh mendefinisikan `awal`.
  - `SandboxKind` memuat `"mikrotik"`; `runChecksNode({ kind: "js" | "express" | "mikrotik", ... })`; enum zod latihan dan proyek memuat `"mikrotik"`; `code_kind` DB memuat `mikrotik` dan `counted_exercise` menghitungnya; `RUNNABLE` memuatnya; `PARTS.mikrotik = ["code"]`.
  - `CodeEditor` menerima `language: "plain"` (tanpa pewarnaan).

- [ ] **Step 1: Tulis tes yang gagal.** `lib/code/mikrotik.test.ts`: `runChecksNode({ kind: "mikrotik", setup: "", code: "/ip address add address=192.168.88.1/24 interface=ether2", tests: [{ name: "alamat", check: 'router.addresses.length === 1 && router.addresses[0].network === "192.168.88.0"' }] })` lulus; skrip kosong gagal pada tes yang sama; `setup` `var awal = { identity: "R9" };` membuat tes `router.identity === "R9"` lulus; `keluaran` memuat gema perintah; skrip berisi `` `${process.exit()}` ``, `</script>`, dan `"; while(true){}; "` tidak menjalankan apa pun sebagai kode dan hasilnya hanya galat `bad command name`. `lib/code/sandbox-doc.test.ts` (tambah): `buildSandboxDoc({ kind: "mikrotik", ... })` memuat `jalankanRouterOS`, tidak memuat `</script>` mentah dari skrip murid, dan tidak memuat `class="..."` dari jenis lain. `worker/prompt.test.ts` (tambah): `exerciseSchema` menerima `kind: "mikrotik"`, dan `failingChecks` untuk solusi benar mengembalikan `[]`, untuk starter mengembalikan nama tes yang gagal.
- [ ] **Step 2:** `npx vitest run lib/code worker`. Hasil: gagal.
- [ ] **Step 3: Implementasi.** `mikrotikCode` di `lib/code/mikrotik.ts`. `buildSandboxDoc`: untuk `mikrotik` pakai jalur worker `js` dengan `shim: routerOSShim.toString()` dan `code: mikrotikCode(files.code ?? "")` (tidak melewati `guardLoops`). `runChecksNode`: pilih shim menurut jenis (`express` memakai `expressShim`, `mikrotik` memakai `routerOSShim`) dan bungkus `code` dengan `mikrotikCode` untuk `mikrotik`. Perluas semua daftar jenis yang tercantum di File Structure (`worker/prompt.ts` baris enum dan `failingChecks`, `lib/content.ts` `RUNNABLE`, dua enum zod aksi admin, opsi `<option value="mikrotik">MikroTik</option>` dan pemeriksaan jenis-yang-bisa-diuji di dua editor admin, `PARTS`, label editor "Editor terminal", `language="plain"` untuk jenis ini). Dua migrasi: `alter type public.code_kind add value if not exists 'mikrotik';` dan `counted_exercise` dengan daftar `('web', 'js', 'express', 'python', 'mikrotik')`.
- [ ] **Step 4:** `npx vitest run`, `npm run lint`, dan `npm run check`. Hasil: hijau. Lalu `npm run db:push` dan periksa `select unnest(enum_range(null::public.code_kind))` memuat `mikrotik`.
- [ ] **Step 5: Commit** `git add -A lib worker components supabase && git commit -m "Code kind mikrotik: simulator runs in the existing sandbox and in the draft validator"`

### Task 3: Dua latihan di bab router dan uji di browser

**Files:**
- Modify: `content/drafts/jaringan-komputer.json`, `GUIDELINE.md`, `e2e/sandbox.e2e.ts`

**Interfaces:**
- Consumes: jenis `mikrotik` dari Task 2.
- Produces: dua latihan di bab `praktik-router-pertama`: `Beri nama dan alamat LAN` dan `Aktifkan DHCP dan NAT`.

- [ ] **Step 1: Tulis latihan.** Latihan 1: router kosong; murid mengganti nama menjadi `R-Kantor` dan memasang `192.168.88.1/24` di `ether2`. Tes: `router.identity === "R-Kantor"`; `router.addresses.some((a) => a.address === "192.168.88.1/24" && a.interface === "ether2")`; `router.addresses.find((a) => a.interface === "ether2")?.network === "192.168.88.0"`. Latihan 2: `setup` `var awal = { addresses: [{ address: "192.168.88.1/24", network: "192.168.88.0", interface: "ether2" }] };`; murid membuat pool `dhcp-lan` `192.168.88.100-192.168.88.200`, server DHCP `dhcp-lan` di `ether2` memakai pool itu, jaringan DHCP `192.168.88.0/24` dengan gateway `192.168.88.1`, dan NAT masquerade keluar `ether1`. Tes: pool ada dengan rentang itu; server memakai pool dan interface itu; jaringan DHCP dengan gateway itu; ada aturan `srcnat` `masquerade` dengan `outInterface === "ether1"`. Kode awal berisi komentar `#` saja (tidak boleh lolos). Tambahkan di body bab bagian `## Latihan di Simulator` sebelum `## Checklist Hasil` yang menjelaskan cara memakai editor terminal dan menyebut perintah yang dipakai; ubah catatan bab (tanpa latihan kode) bila ada.
- [ ] **Step 2:** `npm run draft:check -- jaringan-komputer 38`. Hasil: `OK, siap diimpor`, bab itu menunjukkan `kode 2`; solusi lolos, kode awal tidak.
- [ ] **Step 3:** Tambah ke `GUIDELINE.md` (Adding Code atau bagian jenis latihan) satu butir: jenis `mikrotik`, daftar perintah subset, bentuk `router` dan `keluaran`, dan bahwa pesan galat selain tiga yang pasti adalah pendekatan. Tambah kasus ke `e2e/sandbox.e2e.ts` seperti kasus python: skrip dua perintah menghasilkan hasil tes lulus dan satu perintah salah menghasilkan baris galat di keluaran.
- [ ] **Step 4: Commit dan rilis.** `git add content/drafts/jaringan-komputer.json GUIDELINE.md e2e/sandbox.e2e.ts && git commit && git push`; tunggu build git Ready (jangan `vercel redeploy` sebelum itu). Jalankan `npm run import:manual -- jaringan-komputer` (1 slot dari 10), tunggu `done`, lalu `npm run publish:topic -- jaringan-komputer`. Verifikasi database: 12 bab, ujian 40, latihan 12, kuis bab sama dengan draf, dan `code_exercises` memuat dua latihan `mikrotik`.
- [ ] **Step 5: Cek browser di produksi** (tamu): di bab `praktik-router-pertama` ketik solusi tiap latihan ke editor, klik Jalankan (keluaran terminal tampil dengan baris gema) lalu Periksa (hasil `Lolos`); ketik perintah salah dan lihat baris galat tanpa merusak halaman; kode awal tidak lolos; tampilan di 390px tanpa scroll horizontal; setelah redeploy tunggal sesudah build git Ready.
- [ ] **Step 6:** Laporkan ke owner dengan screenshot dan ringkasan keputusan.

## Self-review

- Cakupan spec proyek 3: jenis latihan baru dengan mesin perintah, subset perintah, galat meniru RouterOS (dengan batas kejujuran), pemeriksa ekspresi atas `state`, dokumentasi subset di GUIDELINE (Task 1 sampai 3).
- Nama konsisten: `routerOSShim`, `jalankanRouterOS`, `mikrotikCode`, `RouterState`, `router`, `keluaran`, `awal`.
- Risiko sisa: kebenaran sintaks RouterOS ditinjau saat ulasan akhir; subset sengaja kecil dan tidak mengemulasi perilaku jaringan nyata; kelas Mikrotik (proyek 4) memakai jenis ini untuk proyek akhirnya.
