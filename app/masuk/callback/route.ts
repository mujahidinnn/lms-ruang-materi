import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

// Two kinds of email link land here. ?code= (PKCE) works only in the browser
// that asked for it; ?token_hash=&type= works on any device, so the email
// template sends that one (GUIDELINE, Auth).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  const { error } = tokenHash && type
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: true };

  if (!error) {
    // A recovery link signs the learner in to set a new password.
    const next = type === "recovery" ? "/profil#sandi" : safeNext(searchParams.get("next"));
    return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/masuk?galat=1", origin));
}
