"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Reads the session cookie locally (no request) so static pages can adapt
// for a signed-in learner after load. null until known.
export function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);
  return signedIn;
}
