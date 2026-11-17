import { SITE_URL } from "@/lib/site";

const FROM = "Ruang Materi <noreply@ruang-materi.mujahidin.my.id>";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Same look as the auth emails (scripts/email-templates.mjs): tables and
// inline styles only. Blank lines in the body start a new paragraph.
export function announcementHtml({ title, body, link }: { title: string; body: string; link?: string | null }) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#3a3b35;">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const url = link ? (link.startsWith("/") ? SITE_URL + link : link) : null;
  const button = url
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px 0 0 0;"><tr><td style="background:#c6e59a;border-radius:999px;"><a href="${esc(url)}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:700;color:#0f100d;text-decoration:none;">Buka di Ruang Materi</a></td></tr></table>`
    : "";
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4ee;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4ee;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;color:#0f100d;">
<tr><td style="padding:0 4px 16px 4px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td><img src="${SITE_URL}/email/logo-mark.png" width="40" height="40" alt="Ruang Materi" style="display:block;border:0;"></td><td style="padding-left:10px;font-size:17px;font-weight:700;">Ruang Materi</td></tr></table></td></tr>
<tr><td style="background:#ffffff;border:1px solid #e4e4da;border-radius:20px;padding:32px 28px;"><h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.25;font-weight:800;">${esc(title)}</h1>${paragraphs}${button}</td></tr>
<tr><td style="padding:16px 4px 0 4px;font-size:12px;line-height:1.6;color:#6b6c63;">Kamu menerima email ini karena punya akun Ruang Materi. Matikan email pengumuman kapan saja di <a href="${SITE_URL}/profil" style="color:#46681c;">pengaturan profil</a>.</td></tr>
</table></td></tr></table></body></html>`;
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
