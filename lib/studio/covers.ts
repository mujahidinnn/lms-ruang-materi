// Card illustrations: src/assets/studio/<slug>.webp (made with the Gemini web
// script, prompts in scripts/studio-covers/docs). Projects without one keep the rocket.
const files = import.meta.glob<string>("/src/assets/studio/*.webp", { eager: true, query: "?url", import: "default" });
export const coverFor = (slug: string): string | undefined => files[`/src/assets/studio/${slug}.webp`];
