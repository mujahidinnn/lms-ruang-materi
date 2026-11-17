import { refresh } from "@/lib/request";
import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

const input = z.object({ user_id: z.uuid(), role: z.enum(["student", "admin"]) });

// The function behind set_user_role checks the caller and refuses a change to
// the caller's own role.
export async function gantiRole(_: { error?: string; ok?: string }, form: FormData) {
  await requireAdmin();
  const parsed = input.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Data tidak valid." };
  const { error } = await (await createClient()).rpc("set_user_role", { target: parsed.data.user_id, new_role: parsed.data.role });
  if (error) return { error: error.code === "P0001" ? error.message : "Gagal mengubah role." };
  refresh();
  return { ok: "Role diubah." };
}
