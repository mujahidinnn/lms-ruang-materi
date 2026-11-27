import * as adminBab from "./admin-bab";
import * as adminImpor from "./admin-impor";
import * as adminLatihanKode from "./admin-latihan-kode";
import * as adminPengguna from "./admin-pengguna";
import * as adminPengumuman from "./admin-pengumuman";
import * as adminPersetujuan from "./admin-persetujuan";
import * as adminProyek from "./admin-proyek";
import * as adminRoadmap from "./admin-roadmap";
import * as adminSlug from "./admin-slug";
import * as adminStudio from "./admin-studio";
import * as adminTopik from "./admin-topik";
import * as adminUjian from "./admin-ujian";
import * as flashcard from "./flashcard";
import * as laporan from "./laporan";
import * as latihan from "./latihan";
import * as masuk from "./masuk";
import * as masukan from "./masukan";
import * as profil from "./profil";
import * as ujian from "./ujian";

const pick = <T extends object>(m: T) =>
  Object.fromEntries(Object.entries(m).filter(([, v]) => typeof v === "function")) as {
    [K in keyof T as T[K] extends (...a: never[]) => unknown ? K : never]: T[K];
  };

// Every function the browser may call through /rpc/<name>. Each one checks
// its own caller (requireUser, requireAdmin); being listed here only makes
// it reachable, like an exported "use server" function was.
export const ACTIONS = {
  ...pick(adminBab),
  ...pick(adminImpor),
  ...pick(adminLatihanKode),
  ...pick(adminPengguna),
  ...pick(adminPengumuman),
  ...pick(adminPersetujuan),
  ...pick(adminProyek),
  ...pick(adminRoadmap),
  ...pick(adminSlug),
  ...pick(adminStudio),
  ...pick(adminTopik),
  ...pick(adminUjian),
  ...pick(flashcard),
  ...pick(laporan),
  ...pick(latihan),
  ...pick(masuk),
  ...pick(masukan),
  ...pick(profil),
  ...pick(ujian),
};
export type Actions = typeof ACTIONS;
export type ActionName = keyof Actions;
