import { z } from "zod";
import { STAGE_IDS } from "./stages";

// What an admin may save for a step; the table checks the same shapes.
const id = z.string().regex(/^[a-z0-9-]{3,60}$/, "ID tidak valid.");
const link = z.string().trim().max(300).refine((u) => /^https:\/\/[^\s]+$/.test(u) || /^\/[^\s/][^\s]*$/.test(u), "Tautan harus diawali https:// atau /.");

export const material = z.discriminatedUnion("kind", [
  z.object({ id, kind: z.literal("kode"), name: z.string().trim().min(1, "Nama berkas wajib diisi.").max(80), lang: z.string().trim().regex(/^[a-z0-9+#-]{0,20}$/, "Bahasa: huruf kecil, tanpa spasi.").default(""), content: z.string().min(1, "Isi kode wajib diisi.").max(20000) }),
  z.object({ id, kind: z.literal("tautan"), name: z.string().trim().min(1, "Nama tautan wajib diisi.").max(80), url: link }),
]);
export const check = z.object({ id, text: z.string().trim().min(1, "Butir periksa tidak boleh kosong.").max(200) });

export const stepInput = z.object({
  stage: z.enum(STAGE_IDS),
  slug: z.string().regex(/^[a-z0-9-]{3,60}$/, "Slug: 3 sampai 60 huruf kecil, angka, atau tanda hubung."),
  title: z.string().trim().min(3, "Judul minimal 3 huruf.").max(120),
  body: z.string().max(20000, "Arahan paling panjang 20.000 karakter."),
  est_minutes: z.coerce.number().int().min(1).max(600).nullable().default(null),
  materials: z.array(material).max(20, "Paling banyak 20 bahan."),
  checks: z.array(check).max(20, "Paling banyak 20 butir periksa."),
});
export type StepInput = z.infer<typeof stepInput>;
export type Material = z.infer<typeof material>;
export type Check = z.infer<typeof check>;

export const defInput = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,40}$/, "Slug: 3 sampai 40 huruf kecil, angka, atau tanda hubung."),
  title: z.string().trim().min(3, "Judul minimal 3 huruf.").max(80),
  summary: z.string().trim().max(400, "Ringkasan paling panjang 400 karakter."),
  level: z.enum(["pemula", "menengah", "lanjut"]),
  est_hours: z.coerce.number().int().min(1).max(200).nullable().default(null),
});
