import type { Prompt } from "../prompt.ts";

export type DraftResult = { output: unknown; inputTokens: number; outputTokens: number };

// jsonSchema: what this call must return (class, chapter or exercise).
export type GenerateDraft = (pdf: Buffer, prompt: Prompt, model: string, jsonSchema: unknown) => Promise<DraftResult>;

// A refusal, a block or a cut-off answer. The message goes to
// import_jobs.error, so it must not contain deck content.
export class ProviderError extends Error {
  name = "ProviderError";
}
