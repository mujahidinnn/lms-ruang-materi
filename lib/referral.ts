// The invite code a learner shares as /daftar?ref=KODE. It rides in a cookie
// from /daftar to the sign-in callback, which claims it (claim_referral).
export const REF_COOKIE = "rm-ref";

// 7 characters, no I, O, 0 or 1 (same alphabet as new_referral_code()).
export function parseRef(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const code = v.trim().toUpperCase();
  return /^[A-HJ-NP-Z2-9]{7}$/.test(code) ? code : null;
}
