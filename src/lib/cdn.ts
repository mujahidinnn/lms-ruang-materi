import type { AstroGlobal } from "astro";

// Public, user-independent pages: the CDN may serve them for a minute and
// revalidate in the background (replaces Next's prerender + updateTag).
export function publicPage(Astro: AstroGlobal) {
  Astro.response.headers.set("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=600");
}
