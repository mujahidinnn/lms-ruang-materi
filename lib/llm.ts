// Providers and models the import dropdown offers. The worker accepts only
// these. Pick IDs from each provider's docs, never guess.
export const LLM_MODELS: Record<string, string[]> = {
  gemini: ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"],
  // Free variants with structured_outputs, from openrouter.ai/api/v1/models.
  openrouter: ["nvidia/nemotron-3-super-120b-a12b:free", "dots-studio/dots-3-note-preview:free"],
};

export function isAllowedModel(provider: string, model: string): boolean {
  return LLM_MODELS[provider]?.includes(model) ?? false;
}

// "provider:model" options for the dropdown, from LLM_PROVIDERS (server
// env). The default (LLM_PROVIDER + LLM_MODEL) comes first.
export function enabledModels(): string[] {
  const providers = (process.env.LLM_PROVIDERS ?? "").split(",").map((s) => s.trim());
  const all = providers.flatMap((p) => (LLM_MODELS[p] ?? []).map((m) => `${p}:${m}`));
  const preferred = `${process.env.LLM_PROVIDER}:${process.env.LLM_MODEL}`;
  return all.includes(preferred) ? [preferred, ...all.filter((m) => m !== preferred)] : all;
}
