import type { GenerateDraft } from "./types.ts";

// Adding a provider: one file here, one entry below, one secret.
export const providers: Record<string, () => Promise<GenerateDraft>> = {
  gemini: async () => (await import("./gemini.ts")).generateDraft,
  openrouter: async () => (await import("./openrouter.ts")).generateDraft,
  // Local runs only (npm run draft:local): the owner's signed-in Gemini web app.
  "gemini-web": async () => (await import("./gemini-web.ts")).generateDraft,
};
