import { refresh } from "@/lib/request";
import { z } from "zod";
import { announcementHtml, sendEmails } from "@/lib/announce-mail";
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
  audience: z.enum(["all", "student", "admin"]),
  web: z.boolean(),
  email: z.boolean(),
});

const first = (e: z.ZodError) => e.issues[0]?.message ?? "Isian tidak valid.";

// One email to the admin who is writing, so the look is checked before it
// goes to everyone. Nothing is stored.
export async function kirimTesPengumuman(input: unknown): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = content.safeParse(input);
  if (!parsed.success) return { error: first(parsed.error) };
  const { title, body, link } = parsed.data;
  try {
    const { sent } = await sendEmails([admin.email], `[Tes] ${title}`, announcementHtml({ title, body, link }));
    return sent ? { ok: `Email tes terkirim ke ${admin.email}.` } : { error: "Email tes gagal terkirim." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Email tes gagal terkirim." };
  }
}

export async function kirimPengumuman(input: unknown): Promise<Result> {
  await requireAdmin();
  const parsed = send.safeParse(input);
  if (!parsed.success) return { error: first(parsed.error) };
  const { title, body, link, audience, web, email } = parsed.data;
  if (!web && !email) return { error: "Pilih minimal satu cara kirim: website atau email." };

  const db = await createClient();
  const { data: row, error } = await db
    .from("announcements")
    .insert({ title, body, link_url: link || null, audience, on_web: web, on_email: email })
    .select("id")
    .single();
  if (error || !row) return { error: "Gagal menyimpan pengumuman." };

  let note = web ? "Tampil di Dashboard murid." : "";
  if (email) {
    const { data: rcpt } = await db.rpc("announce_recipients", { p_audience: audience });
    const to = ((rcpt ?? []) as { email: string }[]).map((r) => r.email);
    try {
      const { sent, failed } = to.length ? await sendEmails(to, title, announcementHtml({ title, body, link })) : { sent: 0, failed: 0 };
      await db.from("announcements").update({ email_sent: sent, email_failed: failed }).eq("id", row.id);
      note += ` Email: ${sent} terkirim${failed ? `, ${failed} gagal` : ""}${to.length ? "" : " (tidak ada penerima)"}.`;
    } catch (e) {
      note += ` Email gagal: ${e instanceof Error ? e.message : "kesalahan tak dikenal"}.`;
    }
  }
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
