"use client";

import { LogOut } from "lucide-react";
import { keluar } from "@/app/masuk/actions";

// Clears the service worker's page cache before signing out, so the next
// person on a shared phone sees nothing of this learner.
export default function SignOutButton({ className }: { className: string }) {
  return (
    <form action={keluar} onSubmit={() => navigator.serviceWorker?.controller?.postMessage("clear-pages")}>
      <button className={`inline-flex items-center gap-2 ${className}`}>
        <LogOut aria-hidden className="size-4" />
        Keluar
      </button>
    </form>
  );
}
