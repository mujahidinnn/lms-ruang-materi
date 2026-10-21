import { ProviderError } from "./types.ts";

// The JSON object in a chat answer: the first ```json block, else the first
// balanced {...} in the text. A cut-off answer throws, so the caller retries
// instead of writing half a draft.
export function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*\n([\s\S]*?)\n?```/.exec(text);
  const candidate = fenced ? fenced[1] : balanced(text);
  if (candidate === null) throw new ProviderError("no JSON in the answer");
  try {
    return JSON.parse(candidate);
  } catch {
    throw new ProviderError("the answer's JSON does not parse");
  }
}

function balanced(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0, inString = false, escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return text.slice(start, i + 1);
  }
  return null;
}

// Gemini on the web marks sources inline ("[cite: 11]", "[cite_start]");
// they mean nothing to a learner, so every string loses them.
export function stripCitations<T>(value: T): T {
  // "[cite: n]" trails a sentence (drop the space before it); "[cite_start]"
  // leads one (drop the space after it).
  if (typeof value === "string")
    return value.replace(/\s*\[cite(?:_end)?(?::[^\]]*)?\]/g, "").replace(/\[cite_start\]\s*/g, "").replace(/[ \t]+$/gm, "") as T;
  if (Array.isArray(value)) return value.map(stripCitations) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripCitations(v)])) as T;
  return value;
}
