import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Slide images are pre-encoded to AVIF by the import worker with
    // careful quality tuning. Next's
    // on-the-fly image optimizer would otherwise decode that AVIF and
    // re-encode it again (usually to WebP, since that's its default
    // format) at its own quality setting, a second lossy pass that
    // visibly softens the image. Serving the pre-encoded files as-is
    // avoids that.
    unoptimized: true,
  },
  cacheComponents: true,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Not X-Frame-Options: DENY, the template preview iframe needs 'self'.
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
