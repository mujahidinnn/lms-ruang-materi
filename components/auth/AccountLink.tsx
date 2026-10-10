"use client";

import { LayoutDashboard, LogIn } from "lucide-react";
import Link from "next/link";
import { useSignedIn } from "./useSignedIn";

export default function AccountLink() {
  const signedIn = useSignedIn();
  return (
    <Link
      href={signedIn ? "/dasbor" : "/masuk"}
      className="ml-2 flex min-h-11 items-center gap-2 rounded-lg border border-zinc-800/80 px-4 text-zinc-50 hover:border-zinc-600 focus-visible:outline-2 focus-visible:outline-accent"
    >
      {signedIn ? <LayoutDashboard aria-hidden className="size-4" /> : <LogIn aria-hidden className="size-4" />}
      {signedIn ? "Dasbor" : "Masuk"}
    </Link>
  );
}
