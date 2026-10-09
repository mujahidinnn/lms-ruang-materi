export const SITE_NAME = "Ruang Materi";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ruang-materi.vercel.app";

export const SITE_DESCRIPTION =
  "Ruang Materi mengubah slide pembelajaran menjadi halaman interaktif yang bisa ditelusuri langsung. Tidak perlu mengunduh atau membuka aplikasi tambahan.";

// Shared Open Graph image (rendered by app/opengraph-image.tsx). Referenced
// explicitly on nested routes so they keep this image while overriding
// their own openGraph title/description. See "Inheriting fields" in the
// Next.js metadata docs: a segment that sets its own `openGraph` object
// replaces the parent's entirely instead of merging field by field.
export const SITE_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
};
