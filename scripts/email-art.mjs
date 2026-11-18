// Renders the app's illustrations into the matcha arch used in emails, as PNGs
// (email clients do not show SVG): public/email/art-<name>.png, 200x276.
//   node scripts/email-art.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";

const W = 200;
const H = 276;
const arch = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><path d="M0 ${H}V${W / 2}A${W / 2} ${W / 2} 0 0 1 ${W} ${W / 2}V${H}Z" fill="#b5d36f"/></svg>`,
);
for (const name of ["masuk", "daftar", "hilang", "baca", "mulai", "kode", "ujian", "sertifikat"]) {
  const h = H - 20; // a little air above the head, feet on the bottom edge
  const art = await sharp(readFileSync(`public/ilustrasi/${name}.svg`), { density: 220 }).resize({ width: W - 10, height: h, fit: "inside" }).png().toBuffer();
  const { width, height: ah } = await sharp(art).metadata();
  await sharp(arch)
    .composite([{ input: art, left: Math.round((W - (width ?? 0)) / 2), top: H - (ah ?? h) }])
    .png({ compressionLevel: 9 })
    .toFile(`public/email/art-${name}.png`);
}
console.log("done");
