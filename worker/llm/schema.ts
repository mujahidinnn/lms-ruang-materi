// Structured output modes (Gemini, OpenRouter providers) accept only a
// small JSON Schema subset; the rest (minLength,
// pattern, ...) is a 400. minItems/maxItems are dropped too: minItems 40 on
// an array of objects is rejected. Counts are asked in the prompt and zod
// still checks the full schema afterwards. Objects get
// additionalProperties: false, which strict mode requires.
const SUPPORTED = new Set([
  "type", "title", "description", "properties", "required", "additionalProperties",
  "enum", "format", "minimum", "maximum", "items", "prefixItems", "anyOf", "$ref",
]);

export function simpleSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(simpleSchema);
  if (!node || typeof node !== "object") return node;
  const out = Object.fromEntries(
    Object.entries(node)
      .filter(([k]) => SUPPORTED.has(k))
      .map(([k, v]) =>
        k === "properties"
          ? [k, Object.fromEntries(Object.entries(v as object).map(([name, sub]) => [name, simpleSchema(sub)]))]
          : [k, simpleSchema(v)]
      )
  );
  return out.type === "object" ? { ...out, additionalProperties: false } : out;
}
