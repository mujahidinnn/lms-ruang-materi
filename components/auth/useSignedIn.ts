"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Reads the session cookie locally (no request) so static pages can adapt
// for a signed-in learner after load, and follows sign-in or sign-out in
// another tab. null until known.
export function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    const auth = createClient().auth;
    auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = auth.onAuthStateChange((_, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}
