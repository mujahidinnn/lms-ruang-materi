import { z } from "zod";
import { getCurrentUser, requireAdmin } from "@/lib/dal";
import { MASUKAN_IDS } from "@/lib/masukan";
import { refresh } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; ok?: string };

const input = z.object({
  category: z.enum(MASUKAN_IDS, "Pilih jenis masukan."),
  message: z.string().trim().min(10, "Tulis minimal 10 karakter.").max(1000, "Paling panjang 1000 karakter."),
  page: z.string().max(200).regex(/^\/\S*$/).or(z.literal("")).default(""),
});

// The page is public, so a signed-out caller gets a message, not a redirect.
export async function kirimMasukan(_: State, form: FormData): Promise<State> {
  const user = await getCurrentUser();
  if (!user) return { error: "Masuk dulu untuk mengirim masukan." };
  const parsed = input.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Isian tidak valid." };
  const { category, message, page } = parsed.data;
  const { error } = await (await createClient()).from("feedback").insert({ user_id: user.id, category, message, page: page || null });
  // 42501: the table's own "5 a day" rule refused the row.
  if (error) return { error: error.code === "42501" ? "Kamu sudah mengirim 5 masukan hari ini. Coba lagi besok." : "Gagal mengirim. Coba lagi sebentar lagi." };
  return { ok: "Terkirim. Terima kasih sudah membantu Ruang Materi jadi lebih baik." };
}

export async function selesaikanMasukan(_: State, form: FormData): Promise<State> {
  await requireAdmin();
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Masukan tidak valid." };
  const { error } = await (await createClient()).from("feedback").update({ status: "selesai" }).eq("id", id.data).eq("status", "baru");
  if (error) return { error: "Gagal menyimpan." };
  refresh();
  return { ok: "Selesai." };
}
