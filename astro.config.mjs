// @ts-check
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Every page renders on request (auth, drafts). Public pages set their own
// CDN Cache-Control instead of a build-time prerender.
export default defineConfig({
  site: "https://lms-ruang-materi.vercel.app",
  output: "server",
  // Skew protection: a page from one deploy keeps loading its own JS chunks
  // after the next deploy goes live.
  adapter: vercel({ skewProtection: true }),
  // CSS inside each page: a cached page can never point at a stylesheet the
  // next deploy removed (pages showed up unstyled right after a deploy).
  build: { inlineStylesheets: "always" },
  integrations: [react()],
  // Hover prefetch, like next/link did.
  prefetch: { defaultStrategy: "hover", prefetchAll: true },
  vite: {
    plugins: [tailwindcss()],
    // The Vercel env keeps its NEXT_PUBLIC_ names from the Next.js build.
    envPrefix: ["PUBLIC_", "NEXT_PUBLIC_"],
  },
});
