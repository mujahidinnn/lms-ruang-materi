// Password storage demo on Web Crypto (browser and Node 20+).
const enc = new TextEncoder();

export type Mode = "plain" | "sha" | "pbkdf2";
export const ITERS = [1000, 10000, 100000, 600000];
export const DICT = ["123456", "password", "qwerty", "rahasia123", "12345678", "admin123", "iloveyou", "indonesia"];

export const toHex = (b: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");

export function randomSalt(n = 16): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}

export async function sha256Hex(s: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}

export async function pbkdf2Hex(pw: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  return toHex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations }, key, 256));
}

export async function store(mode: Mode, pw: string, salt: Uint8Array, iterations: number): Promise<string> {
  if (mode === "plain") return pw;
  if (mode === "sha") return sha256Hex(pw);
  return pbkdf2Hex(pw, salt, iterations);
}

// Attacker's precomputed table: sha256(word) -> word.
export async function buildTable(words = DICT): Promise<Map<string, string>> {
  return new Map(await Promise.all(words.map(async (w) => [await sha256Hex(w), w] as const)));
}

// What a thief with the stolen value can read by lookup alone. Salted hashes never match the table.
export function crack(mode: Mode, stored: string, table: Map<string, string>): string | null {
  if (mode === "plain") return stored;
  if (mode === "sha") return table.get(stored) ?? null;
  return table.get(stored) ?? null; // salted: effectively always null
}
