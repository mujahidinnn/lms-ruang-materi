import { redirect, refresh } from "@/lib/request";
import { z } from "zod";
import { getCurrentUser, requireUser } from "@/lib/dal";
import { safeNext } from "@/lib/safe-next";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; ok?: string };

// usia: "dewasa" (18+, agrees to the privacy policy) or "anak" (under 18,
// a parent or guardian allows it); either records consent, "" withdraws it.
const usia = (form: FormData) => {
  const v = form.get("usia");
  return v === "dewasa" || v === "anak" ? v : null;
};

// The column grant on profiles allows only these fields; the
// timezone is checked against pg_timezone_names by the table.
export async function simpanProfil(_: State, form: FormData): Promise<State> {
  const user = await requireUser("/profil");
  const parsed = z
    .object({
      display_name: z.string().trim().max(80),
      timezone: z.string().min(1).max(64),
      weekly_goal: z.union([z.literal(""), z.coerce.number().int().min(1).max(14)]).default(""),
      public_handle: z.string().trim().toLowerCase().regex(/^([a-z0-9-]{3,30})?$/, "Alamat profil: 3 sampai 30 huruf kecil, angka, atau tanda hubung.").default(""),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Isian tidak valid." };
  // Sharing needs consent on file (adult, or parent/guardian); the database functions check too.
  const adult = usia(form) !== null;

  const { error } = await (await createClient())
    .from("profiles")
    .update({
      display_name: parsed.data.display_name || null,
      timezone: parsed.data.timezone,
      announce_email: form.get("announce_email") === "on",
      weekly_goal: parsed.data.weekly_goal === "" ? null : parsed.data.weekly_goal,
      leaderboard_opt_in: adult && form.get("leaderboard_opt_in") === "on",
      public_handle: adult && parsed.data.display_name && parsed.data.public_handle ? parsed.data.public_handle : null,
      age_group: usia(form),
      guardian_consent: usia(form) !== null,
    })
    .eq("user_id", user.id);
  if (error) return { error: error.code === "23505" ? "Alamat profil itu sudah dipakai orang lain." : "Gagal menyimpan. Periksa zona waktunya." };
  return { ok: "Tersimpan." };
}

// Everything stored about the learner, read through their own RLS.
export async function eksporData() {
  const user = await requireUser("/profil");
  const db = await createClient();
  const tables = ["profiles", "progress", "practice_sessions", "flashcard_reviews", "exam_attempts", "badges", "learning_days", "certificates", "learning_streaks"] as const;
  const rows = await Promise.all(tables.map((t) => db.from(t).select("*").eq("user_id", user.id)));
  return {
    email: user.email,
    exported_at: new Date().toISOString(),
    ...Object.fromEntries(tables.map((t, i) => [t, rows[i].data ?? []])),
  };
}

export async function hapusAkun(_: State, form: FormData): Promise<State> {
  const user = await requireUser("/profil");
  if (String(form.get("email")).trim().toLowerCase() !== user.email.toLowerCase()) {
    return { error: "Email yang kamu ketik tidak sama dengan email akun ini." };
  }
  const db = await createClient();
  const { error } = await db.rpc("delete_own_account");
  if (error) return { error: error.code === "P0001" ? error.message : "Gagal menghapus akun." };
  await db.auth.signOut();
  redirect("/");
}

// One click from the Dasbor notice; the same consent as the Profil checkbox.
// The one-time start screen (/mulai): a display name for certificates and
// the consent that progress saving needs, then back to where the
// learner was going.
export async function mulai(form: FormData) {
  const user = await requireUser("/mulai");
  const parsed = z
    .object({ display_name: z.string().trim().min(1).max(80), next: z.string().optional() })
    .safeParse(Object.fromEntries(form));
  const age = usia(form);
  if (!parsed.success || !age) redirect(`/mulai?galat=1&next=${encodeURIComponent(safeNext(form.get("next")))}`);
  await (await createClient()).from("profiles").update({ display_name: parsed.data!.display_name, age_group: age, guardian_consent: true }).eq("user_id", user.id);
  redirect(safeNext(parsed.data!.next, "/dasbor"));
}

export async function setujuiWali() {
  const user = await requireUser("/dasbor");
  await (await createClient()).from("profiles").update({ guardian_consent: true }).eq("user_id", user.id);
  refresh();
}

// Sets or changes the password. The learner is signed in already (also
// after a lupa-sandi email), which is what proves who they are.
export async function aturSandi(_: State, form: FormData): Promise<State> {
  await requireUser("/profil");
  const parsed = z
    .object({ password: z.string().min(8).max(72), confirm: z.string() })
    .refine((v) => v.password === v.confirm)
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Kata sandi minimal 8 karakter dan kedua kolom harus sama." };
  const { error } = await (await createClient()).auth.updateUser({ password: parsed.data.password });
  if (error?.code === "same_password") return { error: "Kata sandi baru sama dengan yang lama." };
  if (error?.code === "weak_password") return { error: "Kata sandi terlalu lemah. Pakai campuran huruf dan angka." };
  if (error) return { error: "Gagal menyimpan kata sandi, coba lagi." };
  return { ok: "Kata sandi tersimpan. Lain kali bisa masuk dengan email dan kata sandi ini." };
}

// Ganti email: Supabase mails a confirmation to the new address (and the old
// one, double_confirm_changes); the callback verifies it (type=email_change).
export async function gantiEmail(_: State, form: FormData): Promise<State> {
  const user = await requireUser("/profil");
  const parsed = z.object({ email: z.email("Alamat email belum benar.") }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.email.toLowerCase() === user.email.toLowerCase()) return { error: "Itu sudah email akunmu sekarang." };
  const { error } = await (await createClient()).auth.updateUser({ email: parsed.data.email }, { emailRedirectTo: `${SITE_URL}/masuk/callback?next=${encodeURIComponent("/profil#akun")}` });
  if (error?.code === "email_exists") return { error: "Email itu sudah dipakai akun lain." };
  if (error?.status === 429) return { error: "Terlalu sering. Tunggu sebentar, lalu coba lagi." };
  if (error) return { error: "Gagal mengirim email konfirmasi, coba lagi." };
  return { ok: "Cek email lama dan baru, lalu klik tautan konfirmasi di keduanya." };
}

// Ends one other session of this account.
export async function keluarkanPerangkat(form: FormData) {
  await requireUser("/profil");
  const id = z.uuid().safeParse(form.get("id"));
  if (id.success) await (await createClient()).rpc("revoke_my_session", { p_id: id.data });
  refresh();
}

// Google as a second way in (needs enable_manual_linking in Supabase Auth).
export async function hubungkanGoogle() {
  await requireUser("/profil");
  const { data, error } = await (await createClient()).auth.linkIdentity({ provider: "google", options: { redirectTo: `${SITE_URL}/masuk/callback?next=${encodeURIComponent("/profil#akun")}` } });
  if (error || !data.url) redirect("/profil#akun");
  redirect(data.url);
}

// Only while another method remains, or the learner would lock themselves out.
export async function lepasGoogle() {
  await requireUser("/profil");
  const db = await createClient();
  const { data } = await db.auth.getUserIdentities();
  const all = data?.identities ?? [];
  const google = all.find((i) => i.provider === "google");
  if (google && all.length > 1) await db.auth.unlinkIdentity(google);
  refresh();
}

// Fired by the browser on CDN-cached pages, which never reach the server:
// getCurrentUser() records "last seen" (throttled there). No redirect when signed out.
export async function ping() {
  await getCurrentUser();
}
