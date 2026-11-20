// Renders scripts/logos/<name>.svg (Simple Icons, CC0) to <name>-{white,accent,ink}.png
// for deck-simple.py, tinted with each theme's colours.  node scripts/deck-logos.mjs
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const dir = new URL("./logos/", import.meta.url);
const themes = JSON.parse(readFileSync(new URL("./deck-themes.json", import.meta.url), "utf8"));
for (const t of Object.values(themes)) {
  if (!t.logo) continue;
  const svg = readFileSync(new URL(`${t.logo}.svg`, dir), "utf8");
  for (const [tone, hex] of [["white", "FFFFFF"], ["accent", t.accent], ["ink", t.ink]]) {
    const tinted = svg.replace("<svg ", `<svg fill="#${hex}" `);
    writeFileSync(new URL(`${t.logo}-${tone}-${t.accent}.png`, dir), await sharp(Buffer.from(tinted), { density: 600 }).resize(512, 512, { fit: "contain", background: "#0000" }).png().toBuffer());
  }
}
