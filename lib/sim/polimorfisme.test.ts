import { describe, expect, it } from "vitest";
import { cari, events } from "./polimorfisme";

describe("polimorfisme", () => {
  it("override memakai class sendiri", () => {
    expect(cari("Kucing")).toEqual({ rantai: ["Kucing"], ditemukan: "Kucing", suara: "Meong", override: true });
  });
  it("tanpa override jatuh ke induk", () => {
    const r = cari("Ikan");
    expect(r.rantai).toEqual(["Ikan", "Hewan"]);
    expect(r.suara).toBe("...");
    expect(r.override).toBe(false);
  });
  it("events: periksa tiap class lalu hasil", () => {
    const e = events(["Kucing", "Ikan"]);
    expect(e).toHaveLength(2 + 3);
    expect(e.at(-1)?.hasil).toEqual(["Meong", "..."]);
    expect(e[0].selesai).toBe(false);
  });
});
