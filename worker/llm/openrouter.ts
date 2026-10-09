import { draftJsonSchema, type Prompt } from "../prompt.ts";
import { simpleSchema } from "./schema.ts";
import { ProviderError, type DraftResult } from "./types.ts";

// OpenAI-compatible chat API, plain fetch. The free cloudflare-ai parser
// turns the PDF into text, so slide images are not read.
export async function generateDraft(pdf: Buffer, prompt: Prompt, model: string): Promise<DraftResult> {
  const body = JSON.stringify({
    model,
    messages: [
      { role: "system", content: prompt.system },
      {
        role: "user",
        content: [
          { type: "text", text: prompt.user },
          { type: "file", file: { filename: "deck.pdf", file_data: `data:application/pdf;base64,${pdf.toString("base64")}` } },
        ],
      },
    ],
    plugins: [{ id: "file-parser", pdf: { engine: "cloudflare-ai" } }],
    response_format: {
      type: "json_schema",
      json_schema: { name: "draft", strict: true, schema: simpleSchema(draftJsonSchema) },
    },
    provider: { require_parameters: true },
    max_tokens: 32000,
  });

  // Free models answer 429 and 5xx often. Every retry counts against the
  // daily quota, so three attempts at most.
  let res: Response | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 20_000 * attempt));
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(15 * 60 * 1000),
    });
    if (res.status !== 429 && res.status < 500) break;
  }

  const json = await res!.json().catch(() => null);
  if (!res!.ok || !json) {
    throw new ProviderError(`openrouter ${res!.status}: ${json?.error?.message?.slice(0, 200) ?? "no body"}`);
  }
  const choice = json.choices?.[0];
  if (json.error || choice?.finish_reason !== "stop") {
    throw new ProviderError(`openrouter finish_reason: ${choice?.finish_reason ?? json.error?.message ?? "none"}`);
  }

  let output: unknown;
  try {
    output = JSON.parse(choice.message.content);
  } catch {
    throw new ProviderError("openrouter returned invalid JSON");
  }
  return { output, inputTokens: json.usage?.prompt_tokens ?? 0, outputTokens: json.usage?.completion_tokens ?? 0 };
}
