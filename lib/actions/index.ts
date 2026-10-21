import * as adminBab from "./admin-bab";
import * as adminImpor from "./admin-impor";
import * as adminLatihanKode from "./admin-latihan-kode";
import * as adminProyek from "./admin-proyek";
import * as adminRoadmap from "./admin-roadmap";
import * as adminTopik from "./admin-topik";
import * as adminUjian from "./admin-ujian";
import * as flashcard from "./flashcard";
import * as latihan from "./latihan";
import * as masuk from "./masuk";
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
  ...pick(adminProyek),
  ...pick(adminRoadmap),
  ...pick(adminTopik),
  ...pick(adminUjian),
  ...pick(flashcard),
  ...pick(latihan),
  ...pick(masuk),
  ...pick(profil),
  ...pick(ujian),
};
export type Actions = typeof ACTIONS;
export type ActionName = keyof Actions;
