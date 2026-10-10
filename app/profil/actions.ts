"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; ok?: string };

// The column grant on profiles allows only these three fields; the
// timezone is checked against pg_timezone_names by the table.
export async function simpanProfil(_: State, form: FormData): Promise<State> {
  const user = await requireUser("/profil");
  const parsed = z
    .object({ display_name: z.string().trim().max(80), timezone: z.string().min(1).max(64) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Nama paling panjang 80 karakter." };

  const { error } = await (await createClient())
    .from("profiles")
    .update({
      display_name: parsed.data.display_name || null,
      timezone: parsed.data.timezone,
      guardian_consent: form.get("guardian_consent") === "on",
    })
    .eq("user_id", user.id);
  if (error) return { error: "Gagal menyimpan. Periksa zona waktunya." };
  revalidatePath("/profil");
  return { ok: "Tersimpan." };
}

// Everything stored about the learner, read through their own RLS.
export async function eksporData() {
  const user = await requireUser("/profil");
  const db = await createClient();
  const tables = ["profiles", "progress", "practice_sessions", "flashcard_reviews", "exam_attempts", "badges", "learning_days"] as const;
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
export async function setujuiWali() {
  const user = await requireUser("/dasbor");
  await (await createClient()).from("profiles").update({ guardian_consent: true }).eq("user_id", user.id);
  revalidatePath("/dasbor");
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
