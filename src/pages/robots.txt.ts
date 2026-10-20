import type { APIRoute } from "astro";
import { SITE_URL } from "@/lib/site";

export const GET: APIRoute = () =>
  new Response(`User-Agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain" },
  });
