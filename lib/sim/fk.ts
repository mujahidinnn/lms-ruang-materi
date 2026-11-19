export type Kelas = { id: number; nama: string };
export type Siswa = { id: number; nama: string; kelas_id: number };
export type Db = { kelas: Kelas[]; siswa: Siswa[] };
export type Mode = "RESTRICT" | "CASCADE";
export type Result = { db: Db; error?: string; ok?: string };

const FK = "siswa_kelas_id_fkey";

export function deleteKelas(db: Db, id: number, mode: Mode): Result {
  const kids = db.siswa.filter((s) => s.kelas_id === id);
  if (kids.length && mode === "RESTRICT")
    return { db, error: `ERROR: update or delete on table "kelas" violates foreign key constraint "${FK}" on table "siswa"\nDETAIL: Key (id)=(${id}) is still referenced from table "siswa".` };
  return {
    db: { kelas: db.kelas.filter((k) => k.id !== id), siswa: db.siswa.filter((s) => s.kelas_id !== id) },
    ok: kids.length ? `DELETE 1. ON DELETE CASCADE ikut menghapus ${kids.length} baris siswa.` : "DELETE 1. Tidak ada siswa yang bergantung.",
  };
}

export function insertSiswa(db: Db, nama: string, kelas_id: number): Result {
  if (!db.kelas.some((k) => k.id === kelas_id))
    return { db, error: `ERROR: insert or update on table "siswa" violates foreign key constraint "${FK}"\nDETAIL: Key (kelas_id)=(${kelas_id}) is not present in table "kelas".` };
  const id = Math.max(100, ...db.siswa.map((s) => s.id)) + 1;
  return { db: { ...db, siswa: [...db.siswa, { id, nama, kelas_id }] }, ok: "INSERT 0 1" };
}
