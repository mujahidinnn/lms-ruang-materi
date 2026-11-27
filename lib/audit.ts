import type { CurrentUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type Meta = [label: string, value: string][];

// An account's identity for a log row, looked up before the change so a
// deleted account still resolves. Admin only (admin_users checks it).
export async function accountMeta(id: string) {
  const { data } = await (await createClient()).rpc("admin_users");
  const r = ((data ?? []) as { user_id: string; email: string; display_name: string | null; role: string; created_at: string }[]).find((r) => r.user_id === id);
  const meta: Meta = [["Nama", r?.display_name ?? ""], ["Email", r?.email ?? ""], ["ID akun", id], ["Bergabung", r ? new Date(r.created_at).toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }) : ""]];
  return { email: r?.email ?? id, role: r?.role ?? "", meta };
}

// One line in the admin log; meta is the detail shown when the row is opened.
// A failed write never blocks the action it records.
export async function audit(admin: CurrentUser, action: string, detail = "", meta: Meta = []) {
  try {
    await (await createClient()).from("admin_audit_log").insert({ admin_id: admin.id, admin_email: admin.email, action, detail: detail.slice(0, 300), meta: meta.filter(([, v]) => v).map(([k, v]) => [k, v.slice(0, 2000)]) });
  } catch {}
}
