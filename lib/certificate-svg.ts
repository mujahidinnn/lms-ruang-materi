import QRCode from "qrcode";
import bricolage from "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?inline";
import jakarta from "@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2?inline";
import babylonica from "@fontsource/babylonica/files/babylonica-latin-400-normal.woff2?inline";

// The certificate as one SVG drawn on the server: the same A4 landscape
// sheet on every screen and in print, with its fonts inside, and no page
// text to edit in the browser. The verify page (behind the QR) is the proof.

export type CertificateArt = { name: string; topicTitle: string; date: string; code: string; verify: string; sample?: boolean };

export const W = 1123;
export const H = 794;
const INK = "#0f100d";
const PAPER = "#fbfbf6";
const MATCHA = "#b5d36f";
const DEEP = "#46681c";
const LEFT = 84;
const TEXT_W = 690;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ponytail: width from an average glyph width, not real metrics; a long word can run a little wide.
function wrap(text: string, size: number, max: number, perChar = 0.55): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length * size * perChar > max) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const mark = (x: number, y: number, s: number) =>
  `<g transform="translate(${x} ${y}) scale(${s / 32})"><rect width="32" height="32" rx="9" fill="${INK}"/><path d="M15 5c.8 5.4 3.7 8.6 9.5 10-5.8 1.4-8.7 4.6-9.5 10-.8-5.4-3.7-8.6-9.5-10C11.3 13.6 14.2 10.4 15 5Z" fill="${MATCHA}"/><circle cx="24.5" cy="24.5" r="2.5" fill="#e3edc8"/></g>`;

export async function certificateSvg(c: CertificateArt): Promise<string> {
  const qr = await QRCode.toString(c.verify, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: INK, light: "#ffffff" } });
  const qrInner = qr.replace(/^[\s\S]*?<svg[^>]*viewBox="([^"]+)"[^>]*>/, '<svg x="701" y="634" width="96" height="96" viewBox="$1">');

  // The name shrinks to fit one line; the class title wraps to two at most.
  const nameSize = Math.min(58, Math.floor(TEXT_W / Math.max(1, c.name.length * 0.6)));
  const title = wrap(c.topicTitle, 30, TEXT_W, 0.56).slice(0, 2);
  const titleY = 400;
  const descY = titleY + (title.length - 1) * 38 + 44;
  const desc = wrap("dengan menyelesaikan semua bab, lulus ujian akhir, dan menyelesaikan proyek akhir bila kelasnya punya.", 15, 640, 0.52);
  const url = c.verify.replace(/^https?:\/\//, "");
  const ring = "RUANG MATERI · SERTIFIKAT KELAS · BELAJAR NGODING · ";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Sertifikat ${esc(c.topicTitle)} untuk ${esc(c.name)}">
<defs>
<style>
@font-face{font-family:B;src:url(${bricolage}) format("woff2");font-weight:200 800}
@font-face{font-family:J;src:url(${jakarta}) format("woff2");font-weight:200 800}
@font-face{font-family:S;src:url(${babylonica}) format("woff2")}
.b{font-family:B,sans-serif}.j{font-family:J,sans-serif}.s{font-family:S,cursive}
</style>
<linearGradient id="pita" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${MATCHA}"/><stop offset="1" stop-color="#8fb447"/></linearGradient>
<path id="ring" d="M962,400 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0"/>
</defs>
<rect width="${W}" height="${H}" fill="${PAPER}"/>
<rect x="25" y="25" width="${W - 50}" height="${H - 50}" fill="none" stroke="${INK}" stroke-opacity=".14"/>
<rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="none" stroke="${MATCHA}" stroke-width="2"/>

<path d="M862 0H1062V668L962 616L862 668Z" fill="url(#pita)"/>
<text class="b" x="962" y="96" text-anchor="middle" font-size="15" font-weight="800" letter-spacing="4" fill="${INK}">SERTIFIKAT</text>
<text class="b" x="962" y="120" text-anchor="middle" font-size="15" font-weight="800" letter-spacing="4" fill="${INK}">KELAS</text>
<circle cx="962" cy="400" r="94" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
<circle cx="962" cy="400" r="86" fill="none" stroke="${INK}" stroke-dasharray="2 4"/>
<circle cx="962" cy="400" r="58" fill="none" stroke="${INK}" stroke-width="1.5"/>
<text class="b" font-size="11.5" font-weight="800" letter-spacing="2.2" fill="${INK}"><textPath href="#ring">${ring}</textPath></text>
${mark(932, 370, 60)}

${mark(LEFT, 70, 40)}
<text class="b" x="${LEFT + 52}" y="98" font-size="22" font-weight="800" fill="${INK}">Ruang Materi</text>
<text class="j" x="790" y="96" text-anchor="end" font-size="15" fill="${INK}" fill-opacity=".6">${esc(c.date)}</text>

<text class="j" x="${LEFT}" y="180" font-size="14" font-weight="700" letter-spacing="4.5" fill="${DEEP}">SERTIFIKAT KELAS</text>
<text class="j" x="${LEFT}" y="222" font-size="17" fill="${INK}" fill-opacity=".68">Diberikan kepada</text>
<text class="b" x="${LEFT}" y="${222 + nameSize + 8}" font-size="${nameSize}" font-weight="800" fill="${INK}">${esc(c.name)}</text>
<rect x="${LEFT}" y="${222 + nameSize + 26}" width="96" height="3" rx="1.5" fill="${MATCHA}"/>
<text class="j" x="${LEFT}" y="${titleY - 42}" font-size="17" fill="${INK}" fill-opacity=".68">telah menyelesaikan kelas</text>
${title.map((l, i) => `<text class="j" x="${LEFT}" y="${titleY + i * 38}" font-size="30" font-weight="700" fill="${INK}">${esc(l)}</text>`).join("\n")}
${desc.map((l, i) => `<text class="j" x="${LEFT}" y="${descY + i * 22}" font-size="15" fill="${INK}" fill-opacity=".55">${esc(l)}</text>`).join("\n")}

<text class="s" x="${LEFT}" y="688" font-size="46" fill="${INK}">Ruang Materi</text>
<rect x="${LEFT}" y="700" width="220" height="1" fill="${INK}" fill-opacity=".35"/>
<text class="j" x="${LEFT}" y="720" font-size="13" font-weight="700" fill="${INK}">Tim Ruang Materi</text>
<text class="j" x="${LEFT}" y="738" font-size="12" fill="${INK}" fill-opacity=".55">Penerbit sertifikat</text>

<text class="j" x="684" y="682" text-anchor="end" font-size="13" font-weight="700" fill="${INK}">Pindai untuk cek keaslian</text>
<text class="j" x="684" y="701" text-anchor="end" font-size="12" fill="${INK}" fill-opacity=".68">${esc(url)}</text>
<text class="j" x="684" y="720" text-anchor="end" font-size="12" fill="${INK}" fill-opacity=".68">Kode <tspan font-weight="700" fill-opacity="1">${esc(c.code)}</tspan></text>
<rect x="693" y="626" width="112" height="112" rx="10" fill="#ffffff" stroke="${INK}" stroke-opacity=".14"/>
${qrInner}

${c.sample ? `<g transform="translate(470 170) rotate(-12)"><rect x="-130" y="-42" width="260" height="70" rx="12" fill="none" stroke="#c62828" stroke-width="5" opacity=".85"/><text class="b" x="0" y="12" text-anchor="middle" font-size="40" font-weight="800" letter-spacing="10" fill="#c62828" opacity=".85">CONTOH</text></g>` : ""}
</svg>`;
}

// One lookup for the page and the image: /sertifikat/contoh is a labelled
// sample, any other code is read from the database.
export async function loadCertificate(kode: string, kelas: string | null, nama: string | null, getCertificate: (code: string) => Promise<{ code: string; name: string; topicTitle: string; issuedAt: string } | null>, site: string) {
  const sample = kode === "contoh";
  const cert = sample
    ? { code: "CONTOH", name: nama?.trim().slice(0, 60) || "Nama Kamu", topicTitle: kelas?.slice(0, 80) || "Pemrograman Python: Dari Nol sampai Proyek Mini", issuedAt: new Date().toISOString() }
    : await getCertificate(kode);
  if (!cert) return null;
  const date = new Date(cert.issuedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
  return { ...cert, sample, date, verify: `${site}/sertifikat/${sample ? "contoh" : cert.code}` };
}
