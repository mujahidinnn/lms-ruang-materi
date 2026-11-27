import type { CurrentUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type Meta = [label: string, value: string][];

// One line in the admin log; meta is the detail shown when the row is opened.
// A failed write never blocks the action it records.
export async function audit(admin: CurrentUser, action: string, detail = "", meta: Meta = []) {
  try {
    await (await createClient()).from("admin_audit_log").insert({ admin_id: admin.id, admin_email: admin.email, action, detail: detail.slice(0, 300), meta: meta.filter(([, v]) => v).map(([k, v]) => [k, v.slice(0, 2000)]) });
  } catch {}
}
