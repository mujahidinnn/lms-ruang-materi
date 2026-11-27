import { z } from "zod";
import { accountMeta, audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/dal";
import { redirect, refresh } from "@/lib/request";
import { defInput, stepInput } from "@/lib/studio/schema";
import { STUDIO_FEATURE } from "@/lib/studio/stages";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; ok?: string };

// Hide or show a learner's submitted address on their public profile. The
// database function checks the caller is an admin again.
export async function aturKarya(_: State, form: FormData): Promise<State> {
  const admin = await requireAdmin();
  const parsed = z.object({ user: z.uuid(), project: z.string().regex(/^[a-z-]{3,40}$/), hidden: z.enum(["1", "0"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Data tidak valid." };
  const { user, project, hidden } = parsed.data;
  const who = await accountMeta(user);
  const { error } = await (await createClient()).rpc("admin_hide_studio_project", { p_user: user, p_project: project, p_hidden: hidden === "1" });
  if (error) return { error: "Gagal menyimpan." };
  await audit(admin, hidden === "1" ? "Sembunyikan karya" : "Tampilkan karya", `${project} (${who.email})`, [["Proyek", project], ...who.meta, ["Profil publik", hidden === "1" ? "Karya tidak tampil" : "Karya tampil"]]);
  refresh();
  return { ok: hidden === "1" ? "Disembunyikan." : "Ditampilkan." };
}

// ---- Authoring: projects and their steps (admin only) ----------------------
const nameOf = (e: { issues: { message: string }[] }) => e.issues[0]?.message ?? "Isian tidak valid.";

export async function buatProyekStudio(_: State, form: FormData): Promise<State> {
  const admin = await requireAdmin();
  const parsed = defInput.pick({ slug: true, title: true }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: nameOf(parsed.error) };
  const { error } = await (await createClient()).from("studio_defs").insert({ ...parsed.data, summary: "" });
  if (error?.code === "23505") return { error: "Slug itu sudah dipakai proyek lain." };
  if (error) return { error: "Gagal membuat proyek." };
  await audit(admin, "Buat proyek Studio", parsed.data.title, [["Judul", parsed.data.title], ["Slug", parsed.data.slug], ["Halaman admin", `/admin/studio/${parsed.data.slug}`]]);
  redirect(`/admin/studio/${parsed.data.slug}`);
}

export async function simpanProyekStudio(_: State, form: FormData): Promise<State> {
  const admin = await requireAdmin();
  const f = Object.fromEntries(form);
  const id = z.uuid().safeParse(f.id);
  const status = z.enum(["draft", "published"]).safeParse(f.status);
  const parsed = defInput.omit({ slug: true }).safeParse({ ...f, est_hours: f.est_hours === "" ? null : f.est_hours });
  if (!id.success || !status.success) return { error: "Data tidak valid." };
  if (!parsed.success) return { error: nameOf(parsed.error) };
  const db = await createClient();
  if (status.data === "published") {
    const { count } = await db.from("studio_steps").select("id", { count: "exact", head: true }).eq("def_id", id.data);
    if (!count) return { error: "Tambahkan minimal satu langkah sebelum menerbitkan." };
  }
  const { data: def } = await db.from("studio_defs").select("slug, status").eq("id", id.data).maybeSingle();
  const { error } = await db.from("studio_defs").update({ ...parsed.data, status: status.data, updated_at: new Date().toISOString() }).eq("id", id.data);
  if (error) return { error: "Gagal menyimpan." };
  await audit(admin, status.data === "published" ? "Terbitkan proyek Studio" : "Simpan proyek Studio", parsed.data.title, [
    ["Judul", parsed.data.title],
    ["Slug", def?.slug ?? ""],
    ["Tingkat", parsed.data.level],
    ["Perkiraan", parsed.data.est_hours ? `${parsed.data.est_hours} jam` : ""],
    ["Status", `${def?.status ?? "?"} -> ${status.data}`],
    ["Ringkasan", parsed.data.summary],
    ["Halaman admin", def ? `/admin/studio/${def.slug}` : ""],
  ]);
  refresh();
  return { ok: status.data === "published" ? "Tersimpan dan terbit." : "Tersimpan sebagai draf." };
}

export async function hapusProyekStudio(form: FormData) {
  const admin = await requireAdmin();
  const id = z.uuid().parse(form.get("id"));
  const db = await createClient();
  const { data } = await db.from("studio_defs").select("slug, title, status, studio_steps(id)").eq("id", id).maybeSingle();
  const { error } = await db.from("studio_defs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await audit(admin, "Hapus proyek Studio", data?.title ?? id, [["Judul", data?.title ?? ""], ["Slug", data?.slug ?? ""], ["Status", data?.status ?? ""], ["Jumlah langkah", String(data?.studio_steps?.length ?? 0)], ["ID proyek", id]]);
  redirect("/admin/studio");
}

export async function tambahLangkahStudio(form: FormData) {
  const admin = await requireAdmin();
  const { def } = z.object({ def: z.uuid() }).parse(Object.fromEntries(form));
  const db = await createClient();
  const { data: rows } = await db.from("studio_steps").select("position, stage").eq("def_id", def);
  const list = (rows ?? []) as { position: number; stage: string }[];
  const n = list.length + 1;
  const { error } = await db.from("studio_steps").insert({
    def_id: def, position: Math.max(-1, ...list.map((r) => r.position)) + 1, stage: list.at(-1)?.stage ?? "brief",
    slug: `langkah-${n}-${Math.random().toString(36).slice(2, 6)}`, title: `Langkah ${n}`, body: "Tulis arahan lengkap di sini.",
  });
  if (error) throw new Error(error.message);
  const { data: proj } = await db.from("studio_defs").select("title, slug").eq("id", def).maybeSingle();
  await audit(admin, "Tambah langkah Studio", `Langkah ${n} (${proj?.title ?? def})`, [["Proyek", proj?.title ?? ""], ["Langkah", `Langkah ${n}`], ["Halaman admin", proj ? `/admin/studio/${proj.slug}` : ""]]);
  refresh();
}

export async function simpanLangkahStudio(_: State, form: FormData): Promise<State> {
  const admin = await requireAdmin();
  const f = Object.fromEntries(form);
  const id = z.uuid().safeParse(f.id);
  if (!id.success) return { error: "Data tidak valid." };
  const json = (v: unknown) => { try { return JSON.parse(String(v ?? "[]")); } catch { return []; } };
  const parsed = stepInput.safeParse({ ...f, est_minutes: f.est_minutes === "" ? null : f.est_minutes, materials: json(f.materials), checks: json(f.checks) });
  if (!parsed.success) return { error: nameOf(parsed.error) };
  const db = await createClient();
  const { data: mine } = await db.from("studio_steps").select("def_id, studio_defs(title, slug)").eq("id", id.data).single();
  if (!mine) return { error: "Langkah tidak ditemukan." };
  // Item ids are what learners' ticks point to, so they must be unique across the whole project.
  const { data: others } = await db.from("studio_steps").select("checks, materials").eq("def_id", mine.def_id).neq("id", id.data);
  const taken = new Set((others ?? []).flatMap((o) => [...(o.checks as { id: string }[]), ...(o.materials as { id: string }[])].map((x) => x.id)));
  const mineIds = [...parsed.data.checks, ...parsed.data.materials].map((x) => x.id);
  if (new Set(mineIds).size !== mineIds.length || mineIds.some((x) => taken.has(x))) return { error: "Ada ID butir atau bahan yang kembar. Hapus barisnya lalu tambahkan lagi." };
  const { error } = await db.from("studio_steps").update(parsed.data).eq("id", id.data);
  if (error?.code === "23505") return { error: "Slug itu sudah dipakai langkah lain di proyek ini." };
  if (error) return { error: "Gagal menyimpan." };
  const proj = mine.studio_defs as unknown as { title: string; slug: string } | null;
  await audit(admin, "Simpan langkah Studio", parsed.data.title, [
    ["Proyek", proj?.title ?? ""],
    ["Langkah", parsed.data.title],
    ["Tahap", parsed.data.stage],
    ["Slug", parsed.data.slug],
    ["Perkiraan", parsed.data.est_minutes ? `${parsed.data.est_minutes} menit` : ""],
    ["Bahan", String(parsed.data.materials.length)],
    ["Butir periksa", String(parsed.data.checks.length)],
    ["Halaman admin", proj ? `/admin/studio/${proj.slug}` : ""],
  ]);
  return { ok: "Tersimpan." }; // no refresh: the page keeps other steps' unsaved edits
}

// Swaps positions with the neighbour step.
export async function geserLangkahStudio(form: FormData) {
  const admin = await requireAdmin();
  const { id, arah } = z.object({ id: z.uuid(), arah: z.enum(["naik", "turun"]) }).parse(Object.fromEntries(form));
  const db = await createClient();
  const { data: me } = await db.from("studio_steps").select("def_id, position, title, studio_defs(title, slug)").eq("id", id).single();
  if (!me) throw new Error("Langkah tidak ditemukan.");
  const { data: other } = await db.from("studio_steps").select("id, position, title").eq("def_id", me.def_id)
    .filter("position", arah === "naik" ? "lt" : "gt", me.position).order("position", { ascending: arah === "turun" }).limit(1).maybeSingle();
  if (!other) return;
  await db.from("studio_steps").update({ position: other.position }).eq("id", id);
  await db.from("studio_steps").update({ position: me.position }).eq("id", other.id);
  const proj = me.studio_defs as unknown as { title: string; slug: string } | null;
  await audit(admin, "Geser langkah Studio", `${me.title} ${arah} (${proj?.title ?? ""})`, [["Proyek", proj?.title ?? ""], ["Langkah", me.title], ["Arah", arah], ["Bertukar dengan", other.title], ["Halaman admin", proj ? `/admin/studio/${proj.slug}` : ""]]);
  refresh();
}

export async function hapusLangkahStudio(form: FormData) {
  const admin = await requireAdmin();
  const id = z.uuid().parse(form.get("id"));
  const db = await createClient();
  const { data: step } = await db.from("studio_steps").select("title, stage, studio_defs(title)").eq("id", id).maybeSingle();
  const { error } = await db.from("studio_steps").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await audit(admin, "Hapus langkah Studio", step?.title ?? id, [["Proyek", (step?.studio_defs as unknown as { title: string } | null)?.title ?? ""], ["Langkah", step?.title ?? ""], ["Tahap", step?.stage ?? ""], ["ID langkah", id]]);
  refresh();
}

// ---- Early access ------------------------------------------------------------
export async function berikanAksesStudio(form: FormData) {
  const admin = await requireAdmin();
  const user = z.uuid().parse(form.get("user"));
  const who = await accountMeta(user);
  const { error } = await (await createClient()).rpc("admin_grant_feature", { p_user: user, p_feature: STUDIO_FEATURE });
  if (error) throw new Error(error.message);
  await audit(admin, "Beri akses Studio Proyek", who.email, who.meta);
  refresh();
}

export async function cabutAksesStudio(form: FormData) {
  const admin = await requireAdmin();
  const user = z.uuid().parse(form.get("user"));
  const who = await accountMeta(user);
  const { error } = await (await createClient()).rpc("admin_revoke_feature", { p_user: user, p_feature: STUDIO_FEATURE });
  if (error) throw new Error(error.message);
  await audit(admin, "Cabut akses Studio Proyek", who.email, who.meta);
  refresh();
}

export async function bukaStudioUntukSemua(form: FormData) {
  const admin = await requireAdmin();
  const open = z.enum(["1", "0"]).parse(form.get("open")) === "1";
  const { error } = await (await createClient()).rpc("admin_set_feature_open", { p_feature: STUDIO_FEATURE, p_open: open });
  if (error) throw new Error(error.message);
  await audit(admin, open ? "Buka Studio Proyek untuk semua" : "Tutup Studio Proyek (akses terbatas)", "", [["Akses", open ? "Semua pengguna yang masuk bisa membuka Studio Proyek" : "Hanya akun yang diberi akses"], ["Halaman admin", "/admin/studio"]]);
  refresh();
}
