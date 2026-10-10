"use client";

import { LayoutDashboard, LogIn } from "lucide-react";
import Link from "next/link";
import { useSignedIn } from "./useSignedIn";

export default function AccountLink() {
  const signedIn = useSignedIn();
  return (
    <Link
      href={signedIn ? "/dasbor" : "/masuk"}
      className="flex min-h-11 items-center gap-2 rounded-full bg-zinc-50 px-5 text-sm font-semibold text-zinc-950 hover:bg-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {signedIn ? <LayoutDashboard aria-hidden className="size-4" /> : <LogIn aria-hidden className="size-4" />}
      {signedIn ? "Dasbor" : "Masuk"}
    </Link>
  );
}
