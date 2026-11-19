import { expect, test } from "vitest";
import { type Db, deleteKelas, insertSiswa } from "./fk";

const db: Db = { kelas: [{ id: 1, nama: "A" }, { id: 2, nama: "B" }], siswa: [{ id: 101, nama: "x", kelas_id: 1 }] };

test("RESTRICT blocks deleting a referenced parent, allows an unreferenced one", () => {
  expect(deleteKelas(db, 1, "RESTRICT").error).toMatch(/violates foreign key/);
  expect(deleteKelas(db, 2, "RESTRICT").db.kelas).toHaveLength(1);
});

test("CASCADE removes children", () => {
  const r = deleteKelas(db, 1, "CASCADE");
  expect(r.db.siswa).toHaveLength(0);
  expect(r.db.kelas).toEqual([{ id: 2, nama: "B" }]);
});

test("insert needs an existing parent", () => {
  expect(insertSiswa(db, "y", 9).error).toMatch(/not present/);
  expect(insertSiswa(db, "y", 2).db.siswa.at(-1)).toMatchObject({ id: 102, kelas_id: 2 });
});
