# Ruang Materi

Ruang Materi mengubah slide pembelajaran (PowerPoint) menjadi ruang belajar di browser: slide interaktif, ringkasan dan tips, latihan, flashcard, ujian, roadmap per track, level, streak, dan lencana. Tanpa unduh, dan bisa dibuka offline sebagai PWA.

Live: https://lms-ruang-materi.vercel.app

## Cara Kerja

- **Konten** ada di Supabase: topik, slide, tips, flashcard, dan soal di database; gambar slide (AVIF, 3200px dan 1600px) di Storage `slides/<slug>/<folder>/`.
- **Impor**: admin mengunggah `.pptx` di `/admin/impor`. GitHub Actions (`.github/workflows/import-deck.yml`) merender slide dan meminta LLM (Gemini atau OpenRouter) membuat draf ringkasan, tips, flashcard, dan soal. Draf ditinjau lalu diterbitkan di `/admin/topik`.
- **Belajar**: murid masuk lewat tautan email atau kata sandi. Progres, review flashcard, dan ujian dinilai di database (RLS dan fungsi Postgres), bukan di browser.

Aturan kode, keamanan, dan rencana fitur lengkap ada di `GUIDELINE.md`.

## Menjalankan Secara Lokal

Isi `.env.local` (lihat `GUIDELINE.md` untuk daftar lengkap):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Build butuh minimal satu topik published di Supabase.

Database lokal untuk mengetes migrasi:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

## Struktur Proyek

- `app/`: halaman Next.js 16 (App Router, Cache Components).
- `components/`: komponen UI.
- `lib/`: helper tanpa React (`content.ts`, `dal.ts`, `exam.ts`, `leitner.ts`, `level.ts`, `roadmap.ts`, `supabase/`).
- `supabase/migrations/`: skema, RLS, fungsi. `supabase/tests/`: smoke test keamanan (pgTAP).
- `worker/`: worker impor deck yang dijalankan GitHub Actions.
- `scripts/`: `db-push`, `draft-decks`, `backfill-slide-variants`.
- `public/sw.js`: service worker untuk mode offline.

## Skrip

| Perintah | Keterangan |
| --- | --- |
| `npm run dev` | Jalankan server pengembangan Next.js |
| `npm run build` | Build untuk produksi |
| `npm run lint` | Jalankan ESLint |
| `npm run test:run` | Jalankan Vitest sekali |
| `npm run test:e2e` | Test end-to-end Playwright sebagai tamu (`E2E_BASE_URL`, default localhost:3000) |
| `npm run db:push` | Kirim migrasi ke database produksi lewat session pooler |
| `npm run draft:decks -- <slug>...` | Buat draf materi dari deck migrasi |

CI (`.github/workflows/ci.yml`) menjalankan typecheck, lint, Vitest, dan smoke test database di setiap push. `.github/workflows/e2e.yml` menjalankan test end-to-end ke setiap deploy produksi Vercel.
