import type { CurrentUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

// One line in the admin log. A failed write never blocks the action it records.
export async function audit(admin: CurrentUser, action: string, detail = "") {
  try {
    await (await createClient()).from("admin_audit_log").insert({ admin_id: admin.id, admin_email: admin.email, action, detail: detail.slice(0, 300) });
  } catch {}
}
