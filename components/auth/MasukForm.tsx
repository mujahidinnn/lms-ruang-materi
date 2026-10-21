"use client";

import { useActionState, useState } from "react";
import type { MasukState } from "@/lib/actions/masuk";
import { primaryButton } from "@/components/ui/styles";
import { rpc } from "@/lib/rpc";

const masuk = rpc("masuk");

export default function MasukForm({ next, galat }: { next: string; galat: boolean }) {
  const [state, action, pending] = useActionState<MasukState, FormData>(
    masuk,
    galat
      ? { status: "error", message: "Link sudah kedaluwarsa atau tidak valid. Minta link baru." }
      : { status: "idle" }
  );

  // Magic link first: it signs in and signs up in one step. A password is
  // for those who set one in Profil.
  const [withPassword, setWithPassword] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div role="tablist" aria-label="Cara masuk" className="mb-2 grid grid-cols-2 gap-1 rounded-full bg-zinc-800 p-1">
        {[
          [false, "Link email"],
          [true, "Password"],
        ].map(([pw, label]) => (
          <button
            key={String(label)}
            type="button"
            role="tab"
            aria-selected={withPassword === pw}
            onClick={() => setWithPassword(pw as boolean)}
            className={`min-h-10 rounded-full text-sm font-semibold ${withPassword === pw ? "bg-primary text-on-primary" : "text-zinc-400 hover:text-zinc-50"}`}
          >
            {label}
          </button>
        ))}
      </div>
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
      {withPassword ? (
        <>
          <label htmlFor="password" className="mt-1 text-sm font-medium text-zinc-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            aria-describedby="password-hint"
            className="min-h-12 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <p id="password-hint" className="text-xs text-zinc-500">
            Lupa password? Pilih Link email, lalu buat yang baru di Profil.
          </p>
        </>
      ) : (
        <p className="text-xs text-zinc-500">
          Kami kirim link ke emailmu. Klik link-nya dan kamu langsung masuk. Belum punya akun? Akun dibuat otomatis.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={`${primaryButton} mt-2 w-full`}
      >
        {pending ? "Memproses..." : withPassword ? "Masuk" : "Kirim link masuk"}
      </button>
      <p aria-live="polite" className="min-h-5 text-sm">
        {state.status === "sent" && (
          <span className="text-accent">Link sudah dikirim. Cek email kamu.</span>
        )}
        {state.status === "error" && <span className="text-red-500">{state.message}</span>}
      </p>
    </form>
  );
}
