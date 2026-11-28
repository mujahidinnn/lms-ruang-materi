# Kelas dan Studio Proyek berbayar

Status: draf, belum dibangun. Pemilik (2026-11-28) berencana membuat sebagian kelas dan sebagian Studio Proyek berbayar. Semua pilihan teknis di bawah adalah usulan Claude. Bagian "Keputusan terbuka" wajib dijawab sebelum mulai.

GUIDELINE.md, "Out of Scope", masih melarang "Payments, paid courses, subscriptions". Bagian itu harus diubah lebih dulu, baru kode boleh ditulis.

## Tujuan

- Admin menandai satu kelas (`topics`) atau satu Studio Proyek (`studio_defs`) sebagai berbayar, lengkap dengan harganya.
- Murid membeli sekali dan aksesnya berlaku selamanya. Bukan langganan.
- Bab pertama kelas berbayar tetap gratis sebagai pratinjau.
- Hak akses ditegakkan di database lewat RLS dan fungsi, bukan hanya disembunyikan di UI. Ini sesuai GUIDELINE, "Database Rules Live in the Database".
- Pembayaran memakai metode lokal: QRIS, virtual account, dan e-wallet.

## Bukan tujuan

- Langganan bulanan atau paket semua kelas.
- Kupon dan diskon (bisa ditambah belakangan).
- Afiliasi atau komisi referral.
- Saldo atau dompet di dalam aplikasi.

## Anti-tujuan

Rencana ini gagal kalau:
- isi bab berbayar bisa dibaca tanpa membeli, lewat API Supabase dengan publishable key, cache CDN, pencarian, atau URL slide;
- akses terbuka tanpa pembayaran yang terverifikasi di server, misalnya karena webhook palsu atau harga yang dikirim dari browser;
- satu pembayaran membuka akses dua kali atau ke akun lain;
- murid yang sudah belajar di kelas yang kemudian dijadikan berbayar kehilangan progresnya tanpa keputusan pemilik.

## Data

| Tabel | Kolom | Catatan |
| --- | --- | --- |
| `topics` | `+ price int` | rupiah, `null` = gratis; `check (price is null or price >= 1000)` |
| `studio_defs` | `+ price int` | sama |
| `orders` | `id`, `user_id`, `item_kind` (`topic`, `studio`), `item_id`, `amount`, `status` (`pending`, `paid`, `expired`, `failed`, `refunded`), `gateway`, `gateway_ref` unique, `created_at`, `paid_at` | murid hanya membaca pesanannya sendiri; semua penulisan lewat fungsi atau service role |
| `entitlements` | `user_id`, `item_kind`, `item_id`, `order_id` (null = hadiah admin), `granted_at`, `revoked_at` | PK `(user_id, item_kind, item_id)`; murid hanya membaca miliknya sendiri |

Fungsi `has_access(kind, id)` bersifat `stable security definer`. Ia mengembalikan true jika item gratis, pemanggilnya admin, atau ada entitlement yang belum dicabut. Pola ini mengikuti `has_feature()` di `20261124060000_studio_proyek.sql`.

`amount` selalu disalin dari `price` oleh database ketika pesanan dibuat. Browser hanya mengirim item yang dibeli.

## Alur bayar

```
browser                    server (/rpc)                gateway              database
-------                    -------------                -------              --------
beli(kelas) ------------>  create_order(kind, id) ---------------------->  orders: pending, amount = price
                           buat transaksi -----------> token / URL
           <-------------  redirect ke halaman bayar
bayar di gateway ----------------------------------->  POST /api/bayar/webhook
                           cek signature + cek status ke API gateway
                           mark_order_paid(ref) --------------------------> orders: paid
                                                                            entitlements: insert
           <-------------  /belajar/<slug>?dibeli=1   (polling status pesanan sampai paid)
```

- Webhook berjalan di `src/pages/api/bayar/webhook.ts`, bukan di `/rpc`, karena pengirimnya pihak luar. Signature diverifikasi dan status pesanan dicek ulang ke API gateway sebelum percaya.
- `mark_order_paid` hanya bisa dijalankan oleh service role. Fungsi ini idempoten per `gateway_ref` dan menolak jika jumlah bayar ≠ `amount`.
- Pesanan `pending` kedaluwarsa setelah 24 jam, mengikuti masa berlaku VA.
- Struk dikirim lewat Resend (`lib/announce-mail.ts`). Ini juga butuh penyesuaian di "Out of Scope", yang saat ini melarang email notifikasi.

## Yang harus dikunci

Hari ini konten yang sudah terbit bisa dibaca siapa saja. Setiap jalur di bawah ini perlu cek `has_access`.

| Jalur | Sekarang | Perubahan |
| --- | --- | --- |
| `chapters`, `chapter_questions`, `code_exercises` (RLS) | anon membaca yang published | baca jika `position = 1` atau `has_access(topic)`; judul bab tetap publik lewat view tanpa `body` supaya daftar isi terlihat |
| `tips`, `flashcards`, `practice_questions` (RLS) | publik | `has_access(topic)` |
| `lib/content.ts` (`publicClient` + `cached`) | satu cache untuk semua orang | konten kelas berbayar dibaca dengan client milik user, tidak masuk cache bersama |
| `src/lib/cdn.ts` (`s-maxage=60`) | halaman bab di-cache di CDN | halaman bab berbayar memakai `private, no-store` |
| Storage `slides` | bucket publik | kelas berbayar memakai bucket privat + signed URL berumur pendek (lihat keputusan 3) |
| `search_content()` | security invoker | sudah mengikuti RLS, cukup diuji |
| `start_exam_attempt`, `issue_certificate`, `pass_project`, `complete_chapter`, `pass_code_exercise` | cek published | tambah cek `has_access` |
| `studio_steps` (RLS) | `has_feature('studio-proyek')` | tambah `has_access(studio)`; `studio_defs` tetap terbaca untuk halaman jual |
| sitemap, SEO | semua bab | hanya halaman kelas dan bab pratinjau |

## UI

- **Halaman kelas:** harga, tombol "Beli kelas", daftar bab dengan ikon gembok, dan bab 1 terbuka.
- **Bab terkunci:** kartu ajakan beli, bukan halaman 404.
- **Dasbor:** bagian "Kelas yang kamu beli".
- **`/profil`:** riwayat pesanan, berisi status dan struk.
- **Admin:**
  - kolom harga di editor kelas dan Studio;
  - halaman `/admin/pesanan` (daftar, filter status, total pendapatan);
  - tombol "Beri akses" dan "Cabut akses". Penulisannya lewat `requireAdmin`, jadi tetap masuk antrean persetujuan untuk admin yang bukan approver.
- Desain lewat skill frontend-design, plus cek screenshot terang, gelap, dan mobile.

## Tes

- **`security_smoke.sql`:**
  - anon dan murid tanpa entitlement tidak bisa membaca `body` bab 2 kelas berbayar, `code_exercises`, maupun `flashcards`;
  - murid tidak bisa insert atau update `orders` dan `entitlements`;
  - `mark_order_paid` ditolak untuk role `authenticated`;
  - pembayaran ganda tidak menambah baris entitlement.
- **Unit:** verifikasi signature webhook memakai payload contoh dari dokumentasi gateway.
- **E2E:** murid membuka kelas berbayar, bab 2 terkunci, lalu membeli lewat mode sandbox gateway dan bab 2 terbuka. Tes dilewati jika secret sandbox tidak ada.

## Urutan kerja

1. Ubah GUIDELINE "Out of Scope", lalu tulis migrasi `price`, `orders`, `entitlements`, `has_access`, dan kebijakan RLS baru beserta smoke test-nya. Belum ada kelas yang diberi harga, jadi tidak ada perubahan yang terlihat.
2. Ubah pembacaan konten: `lib/content.ts`, header CDN, dan bucket slide privat untuk kelas berbayar.
3. Hak akses manual dari admin, tanpa gateway. Ini sudah cukup untuk menjual lewat transfer manual sambil menunggu akun gateway disetujui.
4. Integrasi gateway: `create_order`, webhook, struk, dan E2E sandbox.
5. UI jual dan riwayat pesanan, lalu beri harga pada kelas pertama.

## Keputusan terbuka

1. **Gateway:** Midtrans (Snap) atau Xendit (Invoice)? Keduanya mendukung QRIS, VA, dan e-wallet. Akun produksi butuh legalitas usaha atau KTP + NPWP pemilik. Biaya per transaksi kira-kira setara. Usulan: Midtrans, karena Snap paling sedikit kodenya.
2. **Kelas yang sudah berjalan:** jika kelas gratis dijadikan berbayar, apakah murid yang sudah mulai otomatis mendapat akses gratis (grandfathering)? Usulan: ya, untuk murid yang punya progres sebelum tanggal harga dipasang.
3. **Slide kelas berbayar:** pindah ke bucket privat dengan signed URL (aman, tapi gambar tidak bisa di-cache CDN lama), atau biarkan publik (URL berisi UUID acak sehingga sulit ditebak, tapi bisa dibagikan)? Usulan: privat.
4. **Murid di bawah umur:** pembayaran oleh murid dengan `guardian_consent`. Cukup dengan centang persetujuan wali, atau dibatasi untuk 18+?
5. **Refund:** kebijakan dan batas waktu. Refund mencabut entitlement (`revoked_at`), progres tetap disimpan.
6. **Pajak dan invoice:** apakah perlu nomor invoice resmi atau PPN? Ini memengaruhi format struk.
7. **Ujian dan sertifikat:** apakah ikut berbayar bersama kelasnya (usulan: ya), atau kelas gratis tapi sertifikatnya berbayar?
