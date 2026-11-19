import type { APIRoute } from "astro";
import { SITE_URL } from "@/lib/site";

// Private screens also carry noindex; Disallow just saves crawl budget.
const PRIVATE = ["admin", "rpc", "dasbor", "profil", "nilai", "ujian", "mulai", "masuk", "daftar"];

export const GET: APIRoute = () =>
  new Response(`User-Agent: *\nAllow: /\n${PRIVATE.map((p) => `Disallow: /${p}`).join("\n")}\n\nSitemap: ${SITE_URL}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain" },
  });
