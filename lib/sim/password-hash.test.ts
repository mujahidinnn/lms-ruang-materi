import { expect, test } from "vitest";
import { buildTable, crack, pbkdf2Hex, randomSalt, sha256Hex, store } from "./password-hash";

test("sha256 matches known vector", async () => {
  expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("pbkdf2 matches RFC 7914 style vector (sha256, 1 iter)", async () => {
  const h = await pbkdf2Hex("password", new TextEncoder().encode("salt"), 1);
  expect(h).toBe("120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b");
});

test("same password: unsalted equal, salted differ and resist the table", async () => {
  const t = await buildTable();
  const [s1, s2] = [randomSalt(), randomSalt()];
  expect(await store("sha", "rahasia123", s1, 1000)).toBe(await store("sha", "rahasia123", s2, 1000));
  const a = await store("pbkdf2", "rahasia123", s1, 1000);
  expect(a).not.toBe(await store("pbkdf2", "rahasia123", s2, 1000));
  expect(crack("pbkdf2", a, t)).toBeNull();
  expect(crack("sha", await sha256Hex("rahasia123"), t)).toBe("rahasia123");
  expect(crack("sha", await sha256Hex("kuda-biru-9!"), t)).toBeNull();
  expect(crack("plain", "apa saja", t)).toBe("apa saja");
});
