// Checks on a .pptx without unzipping it. Zip entry names are stored
// uncompressed, so slide parts can be counted from the raw bytes.

export const MAX_PPTX_BYTES = 50 * 1024 * 1024;
export const MAX_SLIDES = 80;

export function isZip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

export function countSlides(bytes: Uint8Array): number {
  const text = new TextDecoder("latin1").decode(bytes);
  return new Set(text.match(/ppt\/slides\/slide\d+\.xml/g)).size;
}

// Rough Gemini cost: about 258 tokens per PDF page in, a fixed draft out.
export function estimateTokens(slides: number): { input: number; output: number } {
  return { input: slides * 258 + 1500, output: 16000 };
}
