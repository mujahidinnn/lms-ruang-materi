"use client";

import { useActionState } from "react";
import { masuk, type MasukState } from "@/app/masuk/actions";

export default function MasukForm({ next, galat }: { next: string; galat: boolean }) {
  const [state, action, pending] = useActionState<MasukState, FormData>(
    masuk,
    galat
      ? { status: "error", message: "Tautan sudah kedaluwarsa atau tidak valid. Minta tautan baru." }
      : { status: "idle" }
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="email" className="text-sm text-zinc-300">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="min-h-11 rounded-md border border-zinc-800/80 bg-zinc-900 px-3 text-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <label htmlFor="password" className="mt-1 text-sm text-zinc-300">
        Kata sandi <span className="text-zinc-500">(opsional)</span>
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        aria-describedby="password-hint"
        className="min-h-11 rounded-md border border-zinc-800/80 bg-zinc-900 px-3 text-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <p id="password-hint" className="text-xs text-zinc-500">
        Kosongkan untuk masuk lewat tautan email.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-md bg-accent px-4 font-medium text-zinc-950 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
      >
        {pending ? "Memproses..." : "Masuk"}
      </button>
      <p aria-live="polite" className="min-h-5 text-sm">
        {state.status === "sent" && (
          <span className="text-accent">Tautan sudah dikirim. Cek email kamu.</span>
        )}
        {state.status === "error" && <span className="text-red-500">{state.message}</span>}
      </p>
    </form>
  );
}
