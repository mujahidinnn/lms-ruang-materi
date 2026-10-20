import type { EmailOtpType } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

// Two kinds of email link land here. ?code= (PKCE) works only in the browser
// that asked for it; ?token_hash=&type= works on any device, so the email
// template sends that one (GUIDELINE, Auth).
export const GET: APIRoute = async ({ url, redirect }) => {
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  const { error } = tokenHash && type
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: true };

  // A recovery link signs the learner in to set a new password.
  if (!error) return redirect(type === "recovery" ? "/profil#sandi" : safeNext(url.searchParams.get("next")));
  return redirect("/masuk?galat=1");
};
