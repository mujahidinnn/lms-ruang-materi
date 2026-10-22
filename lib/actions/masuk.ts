import { currentRequest, redirect } from "@/lib/request";
import { z } from "zod";
import { safeNext } from "@/lib/safe-next";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

// Masuk and Daftar (src/pages/masuk, src/pages/daftar). "sent" means an email
// went out: a sign-in link, a confirmation, or a password reset.
export type MasukState = { status: "idle" | "sent" | "error"; message?: string; email?: string; kind?: "link" | "konfirmasi" | "reset"; daftar?: boolean };

// Where the learner was going, kept for the email round trip: the email
// templates link to the site root (GUIDELINE, Auth), so the callback reads
// it back from this cookie when the link opens in the same browser.
export const NEXT_COOKIE = "ruang-materi-next";

const email = z.email("Alamat email belum benar.");
const fail = (message: string, extra: Partial<MasukState> = {}): MasukState => ({ status: "error", message, ...extra });

// Only this site or a local dev server may receive the link; a spoofed
// Origin falls back to SITE_URL even if the Supabase allowlist is loose.
function callbackUrl(next: string) {
  const { request, cookies } = currentRequest();
  const sent = request.headers.get("origin") ?? "";
  const origin = sent === SITE_URL || /^http:\/\/localhost:\d+$/.test(sent) ? sent : SITE_URL;
  cookies.set(NEXT_COOKIE, next, { path: "/", maxAge: 60 * 60, httpOnly: true, sameSite: "lax", secure: origin.startsWith("https") });
  return `${origin}/masuk/callback?next=${encodeURIComponent(next)}`;
}

// Supabase answers a wrong password and an unknown email alike; the message
// offers both ways on.
export async function masuk(_prev: MasukState, form: FormData): Promise<MasukState> {
  const parsed = z.object({ email, password: z.string().min(1, "Isi password-nya.").max(200), next: z.string().optional() }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { error } = await (await createClient()).auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error?.code === "email_not_confirmed") return fail("Email ini belum dikonfirmasi. Buka email konfirmasi dari Ruang Materi, atau masuk lewat link email.");
  if (error) return fail("Email atau password salah.", { daftar: true });
  redirect(safeNext(parsed.data.next, "/dasbor"));
}

// A sign-in link for an existing account; an unknown email is told to sign
// up rather than getting an account it did not ask for.
export async function kirimLink(_prev: MasukState, form: FormData): Promise<MasukState> {
  const parsed = z.object({ email, next: z.string().optional() }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { error } = await (await createClient()).auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: false, emailRedirectTo: callbackUrl(safeNext(parsed.data.next, "/dasbor")) },
  });
  if (error?.code === "otp_disabled" || error?.message.includes("Signups not allowed")) return fail("Email ini belum terdaftar.", { daftar: true });
  if (error?.status === 429) return fail("Terlalu sering. Tunggu sebentar, lalu coba lagi.");
  if (error) return fail("Link gagal dikirim. Coba lagi sebentar lagi.");
  return { status: "sent", kind: "link", email: parsed.data.email };
}

// Sign-up, with or without a password. Name and age go in the user's
// metadata; the callback (or this action, when no confirmation is needed)
// copies them into the profile, so /mulai is not needed afterwards.
export async function daftar(_prev: MasukState, form: FormData): Promise<MasukState> {
  const parsed = z
    .object({
      nama: z.string().trim().min(1, "Isi nama tampilanmu.").max(80),
      email,
      password: z.string().max(72).optional(),
      usia: z.enum(["dewasa", "anak"], { message: "Pilih salah satu pilihan usia." }),
      next: z.string().optional(),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { nama, password, usia } = parsed.data;
  if (password && password.length < 8) return fail("Password minimal 8 karakter.");
  const next = safeNext(parsed.data.next, "/dasbor");
  const data = { display_name: nama, age_group: usia };
  const supabase = await createClient();

  if (!password) {
    const { error } = await supabase.auth.signInWithOtp({ email: parsed.data.email, options: { shouldCreateUser: true, data, emailRedirectTo: callbackUrl(next) } });
    if (error?.status === 429) return fail("Terlalu sering. Tunggu sebentar, lalu coba lagi.");
    if (error) return fail("Link gagal dikirim. Coba lagi sebentar lagi.");
    return { status: "sent", kind: "link", email: parsed.data.email };
  }

  const { data: res, error } = await supabase.auth.signUp({ email: parsed.data.email, password, options: { data, emailRedirectTo: callbackUrl(next) } });
  if (error?.code === "user_already_exists") return fail("Email ini sudah terdaftar. Masuk saja.");
  if (error?.code === "weak_password") return fail("Password terlalu lemah. Pakai minimal 8 karakter campuran huruf dan angka.");
  if (error?.status === 429) return fail("Terlalu sering. Tunggu sebentar, lalu coba lagi.");
  if (error) return fail("Pendaftaran gagal. Coba lagi sebentar lagi.");
  // An existing confirmed email comes back without identities (Supabase
  // hides that it exists); say so instead of promising an email.
  if (res.user && res.user.identities?.length === 0) return fail("Email ini sudah terdaftar. Masuk saja.");
  if (!res.session) return { status: "sent", kind: "konfirmasi", email: parsed.data.email };
  await supabase.from("profiles").update({ display_name: nama, age_group: usia, guardian_consent: true }).eq("user_id", res.user!.id);
  redirect(next);
}

export async function lupaPassword(_prev: MasukState, form: FormData): Promise<MasukState> {
  const parsed = z.object({ email }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { error } = await (await createClient()).auth.resetPasswordForEmail(parsed.data.email, { redirectTo: callbackUrl("/profil#sandi") });
  if (error?.status === 429) return fail("Terlalu sering. Tunggu sebentar, lalu coba lagi.");
  if (error) return fail("Email gagal dikirim. Coba lagi sebentar lagi.");
  // Sent or not (unknown email), the answer is the same.
  return { status: "sent", kind: "reset", email: parsed.data.email };
}

export async function keluar() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// "Lanjut dengan Google" (Supabase Auth, provider google). Shown only when
// PUBLIC_GOOGLE_AUTH=1, once the Google client is set up in Supabase. The
// callback exchanges the ?code= in the same browser (PKCE); a learner new to
// the site goes through /mulai for name and age.
export async function masukGoogle(form: FormData) {
  const next = safeNext(form.get("next"), "/dasbor");
  const { data, error } = await (await createClient()).auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl(next) } });
  if (error || !data.url) redirect(`/masuk?galat=google&next=${encodeURIComponent(next)}`);
  redirect(data.url);
}
