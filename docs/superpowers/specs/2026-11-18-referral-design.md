# Kode referral (ajak teman)

Status: disetujui dengan perubahan dari pemilik (2026-11-18: tanpa hadiah; admin melihat siapa mengajak siapa dan siapa diajak siapa). Pilihan teknis di bawah adalah keputusan Claude, bukan hasil diskusi, kecuali yang tertulis "diminta".

## Maksud

Murid bisa mengajak teman tanpa server mengirim email undangan (hemat kuota Resend, tidak bisa dipakai untuk spam). Diminta: berbasis kode, murid tidak boleh mengundang lewat email.

## Tujuan

- Tiap murid punya satu kode unik dan link `/daftar?ref=KODE`.
- Sistem mencatat siapa mengajak siapa.
- Murid melihat berapa temannya yang sudah bergabung.
- Admin melihat di halaman Pengguna: "diajak oleh siapa" dan "mengajak siapa saja" untuk tiap akun.

## Bukan tujuan

- Hadiah atau poin (diminta tidak ada).
- Papan peringkat.
- Undangan lewat email oleh murid.

## Anti-tujuan

Gagal kalau: murid bisa menambah jumlah ajakan dengan akun palsu atau akun sendiri, kode bisa ditebak lalu diklaim berkali-kali, atau pendaftaran Google dan tanpa-password kehilangan kodenya.

## Pendekatan

1. **Kode di link, disimpan di cookie, diklaim setelah konfirmasi (dipilih).** Berfungsi untuk email+password, link email, dan Google, karena cookie ikut sampai callback.
2. Kode diketik di form daftar saja. Ditolak: pendaftaran Google tidak lewat form kita.
3. Tabel `referrals` dengan riwayat kejadian. Ditolak: berlebihan untuk satu hubungan "diajak oleh".

## Desain

- `profiles.referral_code` (teks unik, 7 karakter huruf besar dan angka tanpa karakter mirip seperti 0/O, dibuat saat profil dibuat; profil lama diisi lewat migration) dan `profiles.referred_by` (uuid, boleh kosong).
- `/daftar?ref=KODE`: server menyimpan KODE di cookie `rm-ref` (httpOnly, 7 hari) bila formatnya valid. Kode tidak dicek ke database di sini.
- Daftar tanpa link yang sama di perangkat lain: kode juga disimpan di metadata sign-up (`ref`), dipakai bila cookie tidak ada. Daftar tanpa konfirmasi email (sesi langsung) mengklaim di `daftar()`.
- Callback masuk (`src/pages/masuk/callback.ts`): setelah sesi terbentuk, bila ada `rm-ref`, panggil RPC `claim_referral(code)`, lalu hapus cookie apa pun hasilnya.
- `claim_referral` (security definer, hanya `authenticated`): menolak bila email belum terkonfirmasi, `referred_by` sudah terisi, kode tidak ditemukan, kode milik sendiri, atau akun dibuat lebih dari 1 hari lalu. Karena berjalan setelah callback, email sudah terkonfirmasi.
- `/profil`: bagian "Ajak teman" berisi kode, tombol salin link, dan jumlah teman yang bergabung (hitungan `referred_by = id sendiri`, lewat RPC supaya murid tidak bisa membaca profil orang lain).
- Admin: `admin_users()` mendapat kolom `referred_by_name` dan `referral_count` (fungsi dibuat ulang karena tipe kembaliannya berubah). Daftar Pengguna menampilkan satu baris kecil "Diajak {nama}" dan "Mengajak {n} orang"; halaman `/admin/pengguna/[id]` menampilkan daftar nama yang diajak dan yang mengajaknya.
- Tidak ada email yang dikirim di jalur ini.

## Diserahkan ke pembangun

Teks dan tata letak bagian profil, nama migration, tes untuk `claim_referral` (kode sendiri, kode ganda, akun lama, kode tidak ada).
