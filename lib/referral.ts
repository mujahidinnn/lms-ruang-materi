import type { SupabaseClient } from "@supabase/supabase-js";

// The invite code a learner shares as /daftar?ref=KODE. It rides in a cookie
// from /daftar to the sign-in callback, which claims it (claim_referral).
export const REF_COOKIE = "rm-ref";

// 7 characters, no I, O, 0 or 1 (same alphabet as new_referral_code()).
export function parseRef(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const code = v.trim().toUpperCase();
  return /^[A-HJ-NP-Z2-9]{7}$/.test(code) ? code : null;
}

// The code to claim: the cookie from /daftar, else the one saved in the
// sign-up metadata (the email link may open in another browser or app).
export function refFrom(cookie: unknown, meta: { ref?: unknown } | null | undefined): string | null {
  return parseRef(cookie) ?? parseRef(meta?.ref);
}

// Asks the database to record the invite. An answer of false (own code, too
// old, unknown) is normal; only a failed call is logged.
export async function claimRef(supabase: SupabaseClient, code: string | null) {
  if (!code) return;
  const { error } = await supabase.rpc("claim_referral", { code });
  if (error) console.error("claim_referral failed", error.message);
}
