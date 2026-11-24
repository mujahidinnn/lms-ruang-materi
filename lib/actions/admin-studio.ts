import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/dal";
import { refresh } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";

type State = { error?: string; ok?: string };

// Hide or show a learner's submitted address on their public profile. The
// database function checks the caller is an admin again.
export async function aturKarya(_: State, form: FormData): Promise<State> {
  const admin = await requireAdmin();
  const parsed = z.object({ user: z.uuid(), project: z.string().regex(/^[a-z-]{3,40}$/), hidden: z.enum(["1", "0"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Data tidak valid." };
  const { user, project, hidden } = parsed.data;
  const { error } = await (await createClient()).rpc("admin_hide_studio_project", { p_user: user, p_project: project, p_hidden: hidden === "1" });
  if (error) return { error: "Gagal menyimpan." };
  await audit(admin, hidden === "1" ? "Sembunyikan karya" : "Tampilkan karya", `${project} (${user})`);
  refresh();
  return { ok: hidden === "1" ? "Disembunyikan." : "Ditampilkan." };
}
