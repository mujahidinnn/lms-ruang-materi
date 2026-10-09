import type { GenerateDraft } from "./types.ts";

// Adding a provider: one file here, one entry below, one secret.
export const providers: Record<string, () => Promise<GenerateDraft>> = {
  gemini: async () => (await import("./gemini.ts")).generateDraft,
};
