import { expect, test } from "vitest";
import { jalankan, urutan } from "./middleware-flow";

const ok = { token: "benar", isi: "valid", db: "normal" } as const;

test("semua lolos sampai handler: 200, error handler tak dipakai", () => {
  const r = jalankan(false, ok);
  expect(r.status).toBe(200);
  expect(r.langkah.map((l) => l.hasil)).toEqual(["next", "next", "next", "respons", "tak tercapai"]);
});

test("auth menolak: 401 dan langkah sesudahnya tak tercapai", () => {
  const r = jalankan(false, { ...ok, token: "tak ada" });
  expect(r.status).toBe(401);
  expect(r.langkah.slice(2).every((l) => l.hasil === "tak tercapai")).toBe(true);
  expect(jalankan(false, { ...ok, db: "gagal" }).status).toBe(500);
});

test("urutan penting: auth dan validasi bertukar mengubah 401 jadi 422", () => {
  const s = { token: "salah", isi: "tidak valid", db: "normal" } as const;
  expect(jalankan(false, s).status).toBe(401);
  expect(jalankan(true, s).status).toBe(422);
  expect(urutan(true)[1]).toBe("validasi");
});
