import type { EmailOtpType } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { NEXT_COOKIE } from "@/lib/actions/masuk";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

// Two kinds of email link land here. ?code= (PKCE) works only in the browser
// that asked for it; ?token_hash=&type= works on any device, so the email
// template sends that one (GUIDELINE, Auth).
export const GET: APIRoute = async ({ url, redirect, cookies }) => {
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  // Google (via Supabase) reports a refused sign-in as ?error_description=.
  const refused = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (refused) {
    console.error("auth callback refused", refused);
    return redirect(`/masuk?galat=google&alasan=${encodeURIComponent(refused.slice(0, 200))}`);
  }

  const { error } = tokenHash && type
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: { message: "tanpa kode" } };
  if (error) {
    console.error("auth callback failed", code ? "code" : "token", error.message);
    // A Google sign-in comes back with ?code=; an email link with a token.
    return redirect(code ? `/masuk?galat=google&alasan=${encodeURIComponent(error.message.slice(0, 200))}` : "/masuk?galat=1");
  }

  // A recovery link signs the learner in to set a new password.
  if (type === "recovery") return redirect("/profil#sandi");

  // Name and age given at sign-up (user metadata) fill an empty profile, so
  // a new learner skips /mulai.
  const { data } = await supabase.auth.getUser();
  const meta = data.user?.user_metadata as { display_name?: string; age_group?: string } | undefined;
  if (data.user && meta?.display_name && (meta.age_group === "dewasa" || meta.age_group === "anak")) {
    const { data: p } = await supabase.from("profiles").select("display_name").eq("user_id", data.user.id).maybeSingle();
    if (!p?.display_name?.trim()) {
      await supabase.from("profiles").update({ display_name: meta.display_name.slice(0, 80), age_group: meta.age_group, guardian_consent: true }).eq("user_id", data.user.id);
    }
  }

  // Where they were going: the link's own ?next=, else the cookie set when
  // the email was sent (same browser), else the dashboard.
  const next = safeNext(url.searchParams.get("next") ?? cookies.get(NEXT_COOKIE)?.value, "/dasbor");
  cookies.delete(NEXT_COOKIE, { path: "/" });
  return redirect(next);
};
