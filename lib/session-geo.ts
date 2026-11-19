import type { SupabaseClient } from "@supabase/supabase-js";
import { currentRequest } from "@/lib/request";

// Call right after a sign-in succeeds: files the visitor's country (Vercel edge
// header) under the new session. Best effort; the device list works without it.
export async function recordCountry(db: SupabaseClient) {
  const c = currentRequest().request.headers.get("x-vercel-ip-country");
  if (c && /^[A-Za-z]{2}$/.test(c)) await db.rpc("record_session_country", { p_country: c }).then(() => {}, () => {});
}
