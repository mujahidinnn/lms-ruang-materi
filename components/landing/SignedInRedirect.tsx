"use client";

import { useEffect } from "react";
import { useSignedIn } from "@/components/auth/useSignedIn";

// The landing stays static; a signed-in learner is sent on to /dasbor.
export default function SignedInRedirect() {
  const signedIn = useSignedIn();
  useEffect(() => {
    if (signedIn) location.replace("/dasbor");
  }, [signedIn]);
  return null;
}
