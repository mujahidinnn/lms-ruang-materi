// The one email layout (auth emails by scripts/email-templates.mjs,
// announcements by lib/announce-mail.ts): the logo, one white card with a
// strong heading and one matcha button, a quiet footer. Tables and inline
// styles, because mail clients ignore the rest; the small <style> only trims
// sizes on phones. Plain .mjs so node and vite both import it.

const INK = "#0f100d";
const MATCHA = "#c6e59a";
const FONT = "'Plus Jakarta Sans',Arial,Helvetica,sans-serif";

/** @param {{
 *  site: string, title: string, intro: string, chip?: string,
 *  tone?: "info" | "warn", button?: { label: string, url: string },
 *  code?: string, meta?: string[], fallback?: boolean, footnote: string,
 * }} o */
export function emailLayout({ site, title, intro, chip = "", tone = "info", button, code, meta = [], fallback = false, footnote }) {
  const chipBg = tone === "warn" ? "#f1efd2" : "#e3edc8";
  const chipHtml = chip
    ? `<p style="margin:0 0 14px 0;"><span style="display:inline-block;background:${chipBg};color:${INK};border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700;">${chip}</span></p>`
    : "";
  const codeHtml = code
    ? `<div style="margin-top:22px;background:#f4f4ee;border-radius:18px;padding:18px 12px;text-align:center;"><span style="font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:${INK};">${code}</span></div>`
    : "";
  const buttonHtml = button
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px;"><tr><td><a class="btn" href="${button.url}" style="display:inline-block;background:${MATCHA};color:${INK};font-size:16px;font-weight:800;text-decoration:none;padding:14px 30px;border-radius:999px;border:2px solid ${INK};">${button.label}</a></td></tr></table>`
    : "";
  const metaHtml = meta.length
    ? `<p style="margin:14px 0 0 0;font-size:13px;line-height:1.6;color:#6b6c63;">${meta.join(" &middot; ")}</p>`
    : "";
  const fallbackHtml =
    fallback && button
      ? `<p style="margin:26px 0 0 0;padding-top:18px;border-top:1px solid #e4e4da;font-size:12px;line-height:1.7;color:#6b6c63;word-break:break-all;">Tombol tidak berfungsi? Salin tautan ini ke browser:<br><a href="${button.url}" style="color:#46681c;">${button.url}</a></p>`
      : "";

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${title}</title>
<style>
@media (max-width:480px){
  .px{padding-left:12px!important;padding-right:12px!important}
  .card{padding:26px 22px!important}
  .h1{font-size:25px!important}
  .btn{display:block!important;text-align:center!important}
}
</style>
</head>
<!-- Generated from lib/email-layout.mjs. Do not edit by hand. -->
<body style="margin:0;padding:0;background:#f4f4ee;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4ee;">
<tr><td align="center" class="px" style="padding:32px 16px 40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;font-family:${FONT};color:${INK};">

<tr><td style="padding:0 6px 18px 6px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td><img src="${site}/email/logo-mark.png?v=2" width="36" height="36" alt="" style="display:block;border:0;"></td>
<td style="padding-left:10px;font-size:17px;font-weight:800;letter-spacing:-0.2px;">Ruang Materi</td>
</tr></table>
</td></tr>

<tr><td class="card" style="background:#ffffff;border:1px solid #e4e4da;border-radius:24px;padding:34px 30px;">
${chipHtml}<h1 class="h1" style="margin:0;font-size:28px;line-height:1.2;font-weight:800;letter-spacing:-0.5px;color:${INK};">${title}</h1>
<p style="margin:12px 0 0 0;font-size:16px;line-height:1.65;color:#3a3b35;">${intro}</p>
${codeHtml}${buttonHtml}${metaHtml}${fallbackHtml}
</td></tr>

<tr><td style="padding:22px 8px 0 8px;">
<p style="margin:0;font-size:13px;line-height:1.6;color:#4b4c44;">${footnote}</p>
<p style="margin:10px 0 0 0;font-size:12px;line-height:1.6;color:#8a8b80;"><a href="${site}" style="color:#46681c;font-weight:700;text-decoration:none;">Ruang Materi</a> &middot; materi pemrograman gratis, satu slide setiap langkah.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>
`;
}
