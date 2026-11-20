import { expect, test } from "vitest";
import { dns, tcp } from "./dns-tcp-handshake";

test("cache hit memangkas lookup DNS dari 9 jadi 3 langkah", () => {
  expect(dns(false)).toHaveLength(9);
  expect(dns(true)).toHaveLength(3);
});

test("handshake tanpa kehilangan: SYN, SYN-ACK, ACK lalu koneksi ESTABLISHED", () => {
  const t = tcp("tidak ada");
  expect(t.slice(0, 3).map((x) => x.label.split(" ")[0])).toEqual(["SYN", "SYN-ACK", "ACK"]);
  expect([t[2].k, t[2].s]).toEqual(["ESTABLISHED", "ESTABLISHED"]);
});

test("paket data hilang memicu timeout lalu retransmisi dengan seq sama", () => {
  const t = tcp("data");
  const i = t.findIndex((x) => x.hilang);
  expect(t[i + 1].timeout).toBe(true);
  expect(t[i + 2].label).toBe(`${t[i].label} (ulang)`);
  expect(t).toHaveLength(11);
});
