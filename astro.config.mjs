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
  adapter: vercel(),
  integrations: [react()],
  // Hover prefetch, like next/link did.
  prefetch: { defaultStrategy: "hover", prefetchAll: true },
  vite: {
    plugins: [tailwindcss()],
    // The Vercel env keeps its NEXT_PUBLIC_ names from the Next.js build.
    envPrefix: ["PUBLIC_", "NEXT_PUBLIC_"],
  },
});
