import type { APIRoute } from "astro";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const GET: APIRoute = () =>
  Response.json(
    {
      id: "/",
      name: SITE_NAME,
      short_name: SITE_NAME,
      description: SITE_DESCRIPTION,
      lang: "id",
      // The landing sends signed-in learners on to /dasbor.
      start_url: "/",
      display: "standalone",
      background_color: "#f4f4ee",
      theme_color: "#f4f4ee",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } }
  );
