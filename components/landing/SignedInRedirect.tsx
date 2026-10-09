"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSignedIn } from "@/components/auth/useSignedIn";

// The landing stays static; a signed-in learner is sent on to /dasbor.
export default function SignedInRedirect() {
  const signedIn = useSignedIn();
  const router = useRouter();
  useEffect(() => {
    if (signedIn) router.replace("/dasbor");
  }, [signedIn, router]);
  return null;
}
