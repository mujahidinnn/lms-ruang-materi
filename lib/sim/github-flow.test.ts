import { expect, test } from "vitest";
import { awal, terapkan, tersedia, type Aksi } from "./github-flow";

const jalan = (alur: "tim" | "fork", a: Aksi[]) => a.reduce(terapkan, awal(alur));

test("alur tim penuh sampai merge dan hapus branch", () => {
  const k = jalan("tim", ["branch", "commit", "commit", "push", "pr", "approve", "merge", "hapus"]);
  expect(k.pr).toBe("merged");
  expect(k.mainCommit).toBe(4);
  expect(k.branch).toBe(false);
});

test("minta perubahan memblokir merge sampai push perbaikan", () => {
  let k = jalan("tim", ["branch", "commit", "push", "pr", "minta"]);
  expect(tersedia(k)).not.toContain("merge");
  k = jalan("tim", ["branch", "commit", "push", "pr", "minta", "commit", "push"]);
  expect(k.pr).toBe("terbuka");
});

test("kontributor luar harus fork dulu, aksi tak sah diabaikan", () => {
  expect(tersedia(awal("fork"))).toEqual(["fork"]);
  expect(jalan("fork", ["branch", "merge"]).riwayat).toEqual([]);
});
