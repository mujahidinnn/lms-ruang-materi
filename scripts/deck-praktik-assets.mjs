// Assets for decks built from public/praktik diagrams (docker, mikrotik):
// <dir>/<diagram>.png (the SVG recolored to the deck theme, 2x), lucide icons
// icons/<name>-w.png / -k.png (256px), and Simple Icons logos
// icons/logo-<name>-w.png / -k.png from a temporary install outside the repo
// (cd /tmp && npm pack simple-icons && tar xzf simple-icons-*.tgz).
// Run: node scripts/deck-praktik-assets.mjs <docker|mikrotik> <dir> <path to simple-icons package>
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const [key, dir, simpleIcons] = process.argv.slice(2);
const T = JSON.parse(readFileSync(new URL("deck-themes.json", import.meta.url), "utf8"))[key];
if (!T || !dir || !simpleIcons) throw new Error("usage: node scripts/deck-praktik-assets.mjs <docker|mikrotik> <dir> <simple-icons path>");
mkdirSync(join(dir, "icons"), { recursive: true });

const py = readFileSync(new URL(`deck-${key}.py`, import.meta.url), "utf8");
const words = new Set(py.match(/[a-z][a-z0-9-]+/g));
const lucide = "node_modules/lucide-react/dist/esm/icons";
const attr = (o) => Object.entries(o).filter(([k]) => k !== "key").map(([k, v]) => `${k}="${v}"`).join(" ");
for (const name of words) {
  if (!existsSync(`${lucide}/${name}.mjs`)) continue;
  const { __iconData } = await import(`../${lucide}/${name}.mjs`);
  if (!__iconData) continue;
  const body = __iconData.node.map(([tag, a]) => `<${tag} ${attr(a)}/>`).join("");
  for (const [suffix, color] of [["w", "#ffffff"], ["k", "#" + T.accent]]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="256" height="256" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
    await sharp(Buffer.from(svg), { density: 300 }).resize(256, 256).png().toFile(join(dir, "icons", `${name}-${suffix}.png`));
  }
}

for (const name of ["docker", "postgresql", "nodedotjs", "caddy", "nginx", "githubactions"]) {
  if (!words.has(name)) continue;
  const logo = readFileSync(join(simpleIcons, "icons", `${name}.svg`), "utf8");
  for (const [suffix, color] of [["w", "#ffffff"], ["k", "#" + T.accent]]) {
    const svg = logo.replace("<path ", `<path fill="${color}" `).replace("<svg ", '<svg width="512" height="512" ');
    await sharp(Buffer.from(svg), { density: 300 }).resize(512, 512).png().toFile(join(dir, "icons", `logo-${name}-${suffix}.png`));
  }
}

// App palette in the praktik SVGs: matcha -> deck accent.
const recolor = (s) => s.replaceAll("#b5d36f", "#" + T.accent).replaceAll("#e3edc8", "#" + T.accentLight);
for (const f of readdirSync("public/praktik").filter((f) => f.endsWith(".svg") && words.has(f.slice(0, -4)))) {
  const svg = recolor(readFileSync(join("public/praktik", f), "utf8"));
  await sharp(Buffer.from(svg), { density: 192 }).png().toFile(join(dir, f.replace(/\.svg$/, ".png")));
}
console.log("assets ->", dir);
