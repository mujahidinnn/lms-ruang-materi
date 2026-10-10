"use client";

import { useActionState } from "react";
import { masuk, type MasukState } from "@/app/masuk/actions";
import { primaryButton } from "@/components/ui/styles";

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
      <label htmlFor="email" className="text-sm font-medium text-zinc-300">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="min-h-12 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <label htmlFor="password" className="mt-1 text-sm font-medium text-zinc-300">
        Kata sandi <span className="text-zinc-500">(opsional)</span>
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        aria-describedby="password-hint"
        className="min-h-12 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <p id="password-hint" className="text-xs text-zinc-500">
        Kosongkan untuk masuk lewat tautan email. Lupa kata sandi? Kosongkan juga, lalu buat yang baru di Profil.
      </p>
      <button
        type="submit"
        disabled={pending}
        className={`${primaryButton} mt-2 w-full`}
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
