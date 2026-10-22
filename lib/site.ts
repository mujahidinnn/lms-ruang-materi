export const SITE_NAME = "Ruang Materi";

export const SITE_URL =
  import.meta.env.NEXT_PUBLIC_SITE_URL ?? "https://ruang-materi.mujahidin.my.id";

export const SITE_DESCRIPTION =
  "Ruang Materi mengubah slide pembelajaran menjadi halaman interaktif yang bisa ditelusuri langsung. Tidak perlu mengunduh atau membuka aplikasi tambahan.";

// Shared Open Graph image: public/opengraph-image.png, rendered once from
// the former app/opengraph-image.tsx (next/og). src/layouts/Base.astro puts
// it on every page.
export const SITE_OG_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
};
