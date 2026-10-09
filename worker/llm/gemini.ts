import { FinishReason, GoogleGenAI, createPartFromUri } from "@google/genai";
import { draftJsonSchema, type Prompt } from "../prompt.ts";
import { ProviderError, type DraftResult } from "./types.ts";

export async function generateDraft(pdf: Buffer, prompt: Prompt, model: string): Promise<DraftResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Files API instead of inline data: decks can pass the 20 MB inline limit.
  const file = await ai.files.upload({
    file: new Blob([new Uint8Array(pdf)], { type: "application/pdf" }),
    config: { mimeType: "application/pdf" },
  });

  try {
    const schema = { ...draftJsonSchema, $schema: undefined };
    const res = await ai.models.generateContent({
      model,
      contents: [createPartFromUri(file.uri!, "application/pdf"), prompt.user],
      config: {
        systemInstruction: prompt.system,
        responseMimeType: "application/json",
        responseJsonSchema: schema,
        maxOutputTokens: 32768,
        httpOptions: { timeout: 15 * 60 * 1000 },
      },
    });

    if (res.promptFeedback?.blockReason) {
      throw new ProviderError(`gemini blocked: ${res.promptFeedback.blockReason}`);
    }
    const reason = res.candidates?.[0]?.finishReason;
    if (reason !== FinishReason.STOP) {
      throw new ProviderError(`gemini finishReason: ${reason ?? "none"}`);
    }

    let output: unknown;
    try {
      output = JSON.parse(res.text ?? "");
    } catch {
      throw new ProviderError("gemini returned invalid JSON");
    }

    return {
      output,
      inputTokens: res.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: res.usageMetadata?.candidatesTokenCount ?? 0,
    };
  } finally {
    await ai.files.delete({ name: file.name! }).catch(() => {});
  }
}
