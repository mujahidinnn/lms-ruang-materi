// .cache/studio-covers/<slug>.png (Gemini, 2400px) -> src/assets/studio/<slug>.webp (800px).
import { readdirSync } from "node:fs";
import sharp from "sharp";

const src = ".cache/studio-covers", out = "src/assets/studio";
for (const f of readdirSync(src).filter((f) => f.endsWith(".png"))) {
  await sharp(`${src}/${f}`).resize(800).webp({ quality: 80 }).toFile(`${out}/${f.replace(".png", ".webp")}`);
  console.log(f);
}
