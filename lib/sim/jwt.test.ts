import { expect, test } from "vitest";
import { b64urlDecode, b64urlEncode, sign, verify } from "./jwt";

test("base64url roundtrip without padding or +/", () => {
  const s = "{\"a\":\"??>>\"}";
  const e = b64urlEncode(s);
  expect(e).not.toMatch(/[+/=]/);
  expect(b64urlDecode(e)).toBe(s);
});

test("matches the jwt.io reference token", async () => {
  // jwt.io default: HS256, secret "your-256-bit-secret"
  const t = await sign({ sub: "1234567890", name: "John Doe", iat: 1516239022 }, "your-256-bit-secret");
  expect(t).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
});

test("verify: valid, tampered, expired, malformed", async () => {
  const now = 1000;
  const t = await sign({ sub: "a", role: "user", exp: now + 60 }, "s3cret");
  expect(await verify(t, "s3cret", now)).toMatchObject({ signature: "valid", expired: false });
  expect((await verify(t, "other", now)).signature).toBe("invalid");
  const [h, , sig] = t.split(".");
  const forged = `${h}.${b64urlEncode(JSON.stringify({ sub: "a", role: "admin", exp: now + 60 }))}.${sig}`;
  expect((await verify(forged, "s3cret", now)).signature).toBe("invalid");
  expect((await verify(t, "s3cret", now + 61)).expired).toBe(true);
  expect((await verify("abc", "s3cret", now)).signature).toBe("malformed");
});
