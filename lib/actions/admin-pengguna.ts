import { createClient as createAnon } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";
import { refresh } from "@/lib/request";
import { z } from "zod";
import { audit, type Meta } from "@/lib/audit";
import { requireAdmin } from "@/lib/dal";
import { loadPeople } from "@/lib/pengguna";
import { createClient } from "@/lib/supabase/server";

// Audit rows name the account, not its UUID. Looked up before the change, so
// a deleted account still resolves.
async function personOf(id: string) {
  const { data } = await (await createClient()).rpc("admin_users");
  const r = ((data ?? []) as { user_id: string; email: string; display_name: string | null; role: string; created_at: string }[]).find((r) => r.user_id === id);
  return { email: r?.email ?? id, meta: [["Nama", r?.display_name ?? ""], ["Email", r?.email ?? ""], ["ID akun", id], ["Bergabung", r ? new Date(r.created_at).toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }) : ""]] as Meta, role: r?.role ?? "" };
}

const input = z.object({ user_id: z.uuid(), role: z.enum(["student", "admin"]) });

// The function behind set_user_role checks the caller and refuses a change to
// the caller's own role.
export async function gantiRole(_: { error?: string; ok?: string }, form: FormData) {
  const admin = await requireAdmin();
  const parsed = input.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Data tidak valid." };
  const who = await personOf(parsed.data.user_id);
  const { error } = await (await createClient()).rpc("set_user_role", { target: parsed.data.user_id, new_role: parsed.data.role });
  if (error) return { error: error.code === "P0001" ? error.message : "Gagal mengubah role." };
  await audit(admin, "Ganti role", `${who.email} menjadi ${parsed.data.role}`, [...who.meta, ["Role sebelumnya", who.role], ["Role baru", parsed.data.role]]);
  refresh();
  return { ok: "Role diubah." };
}

export async function hapusPengguna(_: { error?: string; ok?: string }, form: FormData) {
  const admin = await requireAdmin();
  const parsed = z.uuid().safeParse(form.get("user_id"));
  if (!parsed.success) return { error: "Data tidak valid." };
  const who = await personOf(parsed.data);
  const { error } = await (await createClient()).rpc("admin_delete_user", { target: parsed.data });
  if (error) return { error: error.code === "P0001" ? error.message : "Gagal menghapus pengguna." };
  await audit(admin, "Hapus pengguna", who.email, [...who.meta, ["Role", who.role]]);
  refresh();
  return { ok: "Pengguna dihapus." };
}

// The Pengguna list reloads itself through this, so Online stays current.
export async function daftarPengguna() {
  const admin = await requireAdmin();
  return loadPeople(admin.id);
}

// Sends the sign-up email to a new address, so the person can open the site
// and set their own password. Admin only. Uses a throwaway anon client, so no
// service-role key lives in the app and the admin's own session is untouched.
// The account stays "belum konfirmasi" in the list until the link is opened.
export async function undangPengguna(_: { error?: string; ok?: string }, form: FormData) {
  const admin = await requireAdmin();
  const parsed = z.email("Alamat email belum benar.").safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const anon = createAnon(import.meta.env.NEXT_PUBLIC_SUPABASE_URL!, import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await anon.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: true, data: { invited: true }, emailRedirectTo: `${SITE_URL}/masuk/callback?next=${encodeURIComponent("/dasbor")}` },
  });
  if (error?.status === 429) return { error: "Terlalu sering. Tunggu sebentar, lalu coba lagi." };
  if (error) return { error: "Undangan gagal dikirim. Coba lagi sebentar lagi." };
  await audit(admin, "Undang pengguna", parsed.data);
  return { ok: `Undangan dikirim ke ${parsed.data}. Klik Segarkan untuk melihatnya di daftar.` };
}
