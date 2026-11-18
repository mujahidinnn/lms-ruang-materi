import { emailLayout } from "@/lib/email-layout.mjs";
import { SITE_URL } from "@/lib/site";

const FROM = "Ruang Materi <noreply@ruang-materi.mujahidin.my.id>";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Same layout as the auth emails (lib/email-layout.mjs). Blank lines in the
// body start a new paragraph.
export function announcementHtml({ title, body, link }: { title: string; body: string; link?: string | null }) {
  const intro = body
    .split(/\n{2,}/)
    .map((p) => esc(p).replace(/\n/g, "<br>"))
    .join('</p><p style="margin:12px 0 0 0;font-size:16px;line-height:1.65;color:#3a3b35;">');
  const url = link ? (link.startsWith("/") ? SITE_URL + link : link) : null;
  return emailLayout({
    site: SITE_URL,
    title: esc(title),
    intro,
    chip: "Pengumuman",
    button: url ? { label: "Buka di Ruang Materi", url: esc(url) } : undefined,
    footnote: `Kamu menerima email ini karena punya akun Ruang Materi. <a href="${SITE_URL}/profil" style="color:#46681c;">Matikan pengumuman</a> kapan saja di profilmu.`,
  });
}

// Resend's batch endpoint sends one separate email per item (recipients never
// see each other), up to 100 per call. ponytail: sequential chunks with a
// pause for Resend's 2 requests per second; a queue if lists grow past a few
// hundred, since this runs inside one request.
export async function sendEmails(to: string[], subject: string, html: string): Promise<{ sent: number; failed: number }> {
  const key = process.env.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY; // astro dev only fills import.meta.env
  if (!key) throw new Error("RESEND_API_KEY belum diatur di server.");
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < to.length; i += 100) {
    const chunk = to.slice(i, i + 100);
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(chunk.map((address) => ({ from: FROM, to: [address], subject, html }))),
    });
    if (res.ok) sent += chunk.length;
    else failed += chunk.length;
    if (i + 100 < to.length) await new Promise((r) => setTimeout(r, 600));
  }
  return { sent, failed };
}
