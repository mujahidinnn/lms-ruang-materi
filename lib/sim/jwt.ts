// JWT HS256 helpers on Web Crypto (browser and Node 20+).
const enc = new TextEncoder();
const dec = new TextDecoder();

export function b64urlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? enc.encode(input) : input;
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return dec.decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64urlEncode(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data))));
}

export const HEADER = { alg: "HS256", typ: "JWT" };
export const encodeJson = (o: unknown) => b64urlEncode(JSON.stringify(o));

export async function sign(payload: object, secret: string): Promise<string> {
  const input = `${encodeJson(HEADER)}.${encodeJson(payload)}`;
  return `${input}.${await hmac(secret, input)}`;
}

export type Check = { signature: "valid" | "invalid" | "malformed"; expired: boolean; payload: Record<string, unknown> | null };

export async function verify(token: string, secret: string, now: number): Promise<Check> {
  const parts = token.split(".");
  if (parts.length !== 3) return { signature: "malformed", expired: false, payload: null };
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(b64urlDecode(parts[1]));
  } catch {
    return { signature: "malformed", expired: false, payload: null };
  }
  const ok = (await hmac(secret, `${parts[0]}.${parts[1]}`)) === parts[2];
  const exp = typeof payload.exp === "number" ? payload.exp : Infinity;
  return { signature: ok ? "valid" : "invalid", expired: exp <= now, payload };
}
