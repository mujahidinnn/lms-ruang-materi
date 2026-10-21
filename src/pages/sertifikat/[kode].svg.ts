import type { APIRoute } from "astro";
import { certificateSvg, loadCertificate } from "@/lib/certificate-svg";
import { getCertificate } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

// The certificate image itself (see lib/certificate-svg.ts).
export const GET: APIRoute = async ({ params, url }) => {
  const c = await loadCertificate(params.kode ?? "", url.searchParams.get("kelas"), url.searchParams.get("nama"), getCertificate, SITE_URL);
  if (!c) return new Response("Tidak ditemukan", { status: 404 });
  return new Response(await certificateSvg(c), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // An issued certificate never changes; the sample carries today's date.
      "Cache-Control": c.sample ? "public, max-age=0, s-maxage=3600" : "public, max-age=86400, s-maxage=31536000, immutable",
      "X-Robots-Tag": "noindex",
    },
  });
};
