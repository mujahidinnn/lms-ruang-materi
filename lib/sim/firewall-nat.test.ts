import { expect, test } from "vitest";
import { DEFAULT_RULES, PAKET, TEMPLATE, proses } from "./firewall-nat";

const p = (id: string) => PAKET.find((x) => x.id === id)!;
const nat = { masq: true, dstnat: false };

test("laptop ke web diterima dan sumbernya di-masquerade ke alamat WAN", () => {
  const r = proses(p("web"), DEFAULT_RULES, nat);
  expect([r.chain, r.hasil, r.sesudah.src.ip]).toEqual(["forward", "diterima", "203.0.113.2"]);
});

test("Winbox dari internet dibuang aturan input drop ether1", () => {
  const r = proses(p("winbox-luar"), DEFAULT_RULES, nat);
  expect([r.chain, r.hasil, r.cocok]).toEqual(["input", "dibuang", 2]);
});

test("port forward: dst-nat memindah chain ke forward, accept harus di atas drop", () => {
  const on = { masq: true, dstnat: true };
  expect(proses(p("web-luar"), DEFAULT_RULES, on)).toMatchObject({ chain: "forward", hasil: "dibuang" });
  const urut = [...DEFAULT_RULES.slice(0, 4), TEMPLATE[10], DEFAULT_RULES[4]];
  expect(proses(p("web-luar"), urut, on).hasil).toBe("diterima");
});
