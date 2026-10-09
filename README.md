# Ruang Materi

Ruang Materi mengubah slide pembelajaran (PowerPoint) menjadi halaman interaktif yang bisa ditelusuri langsung di browser, tanpa mengunduh atau membuka aplikasi tambahan.

## Cara Kerja

Semua materi disimpan di Supabase: topik dan slide di database, gambar slide (AVIF) di Storage `slides/<slug>/<folder>/`. Halaman `app/belajar/[slug]` membaca topik yang sudah published lewat `lib/content.ts`. Menambah materi baru lewat `/admin/impor` (menyusul di phase 4).

Aturan kode dan rencana fitur ada di `GUIDELINE.md`.

## Menjalankan Secara Lokal

Isi `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Build butuh minimal satu topik published di Supabase.

## Struktur Proyek

- `app/`: halaman Next.js (App Router).
- `components/`: komponen UI.
- `lib/`: helper tanpa React (`content.ts`, `slides.ts`, `dal.ts`, `supabase/`).
- `supabase/migrations/`: skema, RLS, fungsi. `supabase/tests/`: smoke test keamanan.
- `data/templates.ts`, `public/templates/`: galeri template portofolio.

## Skrip

| Perintah | Keterangan |
| --- | --- |
| `npm run dev` | Jalankan server pengembangan Next.js |
| `npm run build` | Build untuk produksi |
| `npm run start` | Jalankan build produksi |
| `npm run lint` | Jalankan ESLint |
| `npm run test:run` | Jalankan Vitest sekali |
