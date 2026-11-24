import { refresh } from "@/lib/request";
import { z } from "zod";
import { announcementHtml, sendEmails } from "@/lib/announce-mail";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string; ok?: string };

const link = z.string().trim().regex(/^(https:\/\/|\/[^/])/, "Tautan harus diawali https:// atau /").or(z.literal(""));
const content = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi.").max(120, "Judul paling panjang 120 karakter."),
  body: z.string().trim().min(1, "Isi wajib diisi.").max(2000, "Isi paling panjang 2000 karakter."),
  link,
});
const send = content.extend({
  audience: z.enum(["all", "student", "admin", "users"]),
  userIds: z.array(z.uuid()).max(200, "Paling banyak 200 pengguna sekali kirim.").default([]),
  web: z.boolean(),
  email: z.boolean(),
});

const used = (q?: string) => (q ? ` Kuota Resend hari ini: ${q}/100 terpakai.` : "");
const first = (e: z.ZodError) => e.issues[0]?.message ?? "Isian tidak valid.";

// One email to the admin who is writing, so the look is checked before it
// goes to everyone. Nothing is stored.
export async function kirimTesPengumuman(input: unknown): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = content.safeParse(input);
  if (!parsed.success) return { error: first(parsed.error) };
  const { title, body, link } = parsed.data;
  try {
    const { sent, quota } = await sendEmails([admin.email], `[Tes] ${title}`, announcementHtml({ title, body, link }));
    return sent ? { ok: `Email tes terkirim ke ${admin.email}.${used(quota)}` } : { error: "Email tes gagal terkirim." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Email tes gagal terkirim." };
  }
}

export async function kirimPengumuman(input: unknown): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = send.safeParse(input);
  if (!parsed.success) return { error: first(parsed.error) };
  const { title, body, link, audience, userIds, web, email } = parsed.data;
  if (!web && !email) return { error: "Pilih minimal satu cara kirim: website atau email." };
  if (audience === "users" && userIds.length === 0) return { error: "Pilih minimal satu pengguna." };

  const db = await createClient();
  const { data: row, error } = await db
    .from("announcements")
    .insert({ title, body, link_url: link || null, audience, user_ids: audience === "users" ? userIds : [], on_web: web, on_email: email })
    .select("id")
    .single();
  if (error || !row) return { error: "Gagal menyimpan pengumuman." };

  let note = web ? "Tampil di Dashboard murid." : "";
  if (email) {
    const { data: rcpt } = await db.rpc("announce_recipients", { p_audience: audience, p_ids: audience === "users" ? userIds : [] });
    const to = ((rcpt ?? []) as { email: string }[]).map((r) => r.email);
    try {
      const { sent, failed, quota } = to.length ? await sendEmails(to, title, announcementHtml({ title, body, link })) : { sent: 0, failed: 0, quota: undefined };
      await db.from("announcements").update({ email_sent: sent, email_failed: failed }).eq("id", row.id);
      note += ` Email: ${sent} terkirim${failed ? `, ${failed} gagal` : ""}${to.length ? "" : " (tidak ada penerima)"}.${used(quota)}`;
    } catch (e) {
      note += ` Email gagal: ${e instanceof Error ? e.message : "kesalahan tak dikenal"}.`;
    }
  }
  await audit(admin, "Kirim pengumuman", `${title} (${audience}${email ? ", email" : ""})`);
  refresh();
  return { ok: `Terkirim.${note ? " " + note : ""}` };
}

// Removes the banner; emails already sent cannot be recalled.
export async function hapusPengumuman(form: FormData) {
  await requireAdmin();
  const id = z.uuid().parse(form.get("id"));
  const { error } = await (await createClient()).from("announcements").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}
