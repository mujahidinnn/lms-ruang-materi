// The one email layout (auth emails by scripts/email-templates.mjs,
// announcements by lib/announce-mail.ts): a black hero card with the app's
// illustration in a matcha arch, then a white card holding the action.
// Tables and inline styles, because mail clients ignore the rest; the small
// <style> only trims sizes on phones. Plain .mjs so node and vite both import it.

const INK = "#0f100d";
const MATCHA = "#c6e59a";
const FONT = "'Plus Jakarta Sans',Arial,Helvetica,sans-serif";

/** @param {{
 *  site: string, title: string, intro: string, art: string, chip?: string,
 *  tone?: "info" | "warn", button?: { label: string, url: string },
 *  code?: string, meta?: string[], fallback?: boolean, extra?: string,
 *  footnote: string,
 * }} o */
export function emailLayout({ site, title, intro, art, chip = "", tone = "info", button, code, meta = [], fallback = false, extra = "", footnote }) {
  const chipBg = tone === "warn" ? "#f1efd2" : MATCHA;
  const chipHtml = chip
    ? `<td align="right" style="font-size:12px;font-weight:700;"><span style="display:inline-block;background:${chipBg};color:${INK};border-radius:999px;padding:6px 12px;">${chip}</span></td>`
    : "";
  const codeHtml = code
    ? `<div style="background:${INK};border-radius:20px;padding:18px 12px;text-align:center;"><span style="font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:${MATCHA};">${code}</span></div>`
    : "";
  const buttonHtml = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center"><a class="btn" href="${button.url}" style="display:inline-block;background:${MATCHA};color:${INK};font-size:16px;font-weight:800;text-decoration:none;padding:15px 34px;border-radius:999px;border:2px solid ${INK};box-shadow:3px 3px 0 ${INK};">${button.label}</a></td></tr></table>`
    : "";
  const metaHtml = meta.length
    ? `<p style="margin:18px 0 0 0;text-align:center;font-size:13px;line-height:1.6;color:#6b6c63;">${meta.join('<span style="padding:0 8px;color:#b9bab0;">|</span>')}</p>`
    : "";
  const fallbackHtml =
    fallback && button
      ? `<div style="margin-top:22px;background:#f4f4ee;border-radius:16px;padding:14px 16px;"><p style="margin:0 0 6px 0;font-size:12px;color:#6b6c63;">Tombol tidak berfungsi? Salin tautan ini ke browser:</p><a href="${button.url}" style="font-family:'SFMono-Regular',Consolas,'Courier New',monospace;font-size:12px;line-height:1.5;color:#46681c;word-break:break-all;text-decoration:underline;">${button.url}</a></div>`
      : "";
  const action = [codeHtml, buttonHtml, metaHtml, fallbackHtml, extra].filter(Boolean).join("");

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
  .h1{font-size:23px!important}
  .art{width:84px!important;height:auto!important}
  .pad{padding:24px 4px 26px 20px!important}
  .btn{display:block!important;text-align:center!important}
}
</style>
</head>
<!-- Generated from lib/email-layout.mjs. Do not edit by hand. -->
<body style="margin:0;padding:0;background:#f4f4ee;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4ee;">
<tr><td align="center" class="px" style="padding:28px 16px 36px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:${FONT};color:${INK};">

<tr><td style="padding:0 6px 16px 6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td><table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td><img src="${site}/email/logo-mark.png" width="40" height="40" alt="" style="display:block;border:0;"></td>
<td style="padding-left:10px;font-size:18px;font-weight:800;letter-spacing:-0.2px;">Ruang Materi</td>
</tr></table></td>
${chipHtml}
</tr></table>
</td></tr>

<tr><td style="background:${INK};border-radius:28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td class="pad" valign="top" style="padding:30px 8px 30px 28px;">
<h1 class="h1" style="margin:0;font-size:28px;line-height:1.18;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">${title}</h1>
<p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#cfd0c4;">${intro}</p>
</td>
<td valign="bottom" width="132" style="padding:24px 24px 0 0;line-height:0;"><img class="art" src="${site}/email/art-${art}.png" width="108" height="149" alt="" style="display:block;border:0;"></td>
</tr></table>
</td></tr>

<tr><td style="height:12px;line-height:12px;font-size:0;">&nbsp;</td></tr>

${action ? `<tr><td style="background:#ffffff;border:1px solid #e4e4da;border-radius:28px;padding:28px 24px;">${action}</td></tr>` : ""}

<tr><td style="padding:20px 8px 0 8px;font-size:12px;line-height:1.7;color:#6b6c63;">
${footnote}<br>
<a href="${site}" style="color:#46681c;font-weight:700;text-decoration:none;">Ruang Materi</a> &middot; materi pemrograman gratis, satu slide setiap langkah.
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>
`;
}
