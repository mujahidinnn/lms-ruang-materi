"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import type { MasukState } from "@/lib/actions/masuk";
import { primaryButton } from "@/components/ui/styles";
import { rpc } from "@/lib/rpc";
import Terkirim from "./Terkirim";

const ACTION = { password: rpc("masuk"), link: rpc("kirimLink"), lupa: rpc("lupaPassword") };
type Mode = keyof typeof ACTION;
export const field = "min-h-12 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-accent";
const label = "grid gap-1.5 text-sm font-medium text-zinc-300";
const quiet = "text-sm font-semibold text-accent hover:underline";

// Masuk: email + password first; a sign-in link or a password reset are one
// click away. Each mode posts to its own action.
export default function MasukForm({ next, galat }: { next: string; galat: boolean }) {
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const last = useRef<FormData | null>(null);
  const run = (state: MasukState, form: FormData) => {
    if (form.get("reset")) return Promise.resolve<MasukState>({ status: "idle" });
    last.current = form;
    return ACTION[(form.get("mode") as Mode) ?? "password"](state, form) as Promise<MasukState>;
  };
  const [state, action, pending] = useActionState<MasukState, FormData>(
    run,
    galat ? { status: "error", message: "Link sudah kedaluwarsa atau sudah dipakai. Minta link baru." } : { status: "idle" }
  );

  const reset = () => startTransition(() => { const f = new FormData(); f.set("reset", "1"); action(f); });
  if (state.status === "sent") {
    return <Terkirim state={state} busy={pending} onResend={() => last.current && startTransition(() => action(last.current!))} onBack={reset} />;
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="mode" value={mode} />
      <h2 className="text-2xl font-extrabold tracking-tight">{mode === "lupa" ? "Lupa password" : "Masuk ke akunmu"}</h2>
      {mode === "lupa" && <p className="-mt-2 text-sm text-zinc-400">Isi emailmu. Kami kirim link untuk membuat password baru.</p>}
      {mode === "link" && <p className="-mt-2 text-sm text-zinc-400">Tanpa password: kami kirim link masuk ke emailmu.</p>}
      <label className={label}>
        Email
        <input name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      </label>
      {mode === "password" && (
        <label className={label}>
          <span className="flex items-center justify-between">Password<button type="button" onClick={() => setMode("lupa")} className={quiet}>Lupa password?</button></span>
          <input name="password" type="password" required autoComplete="current-password" className={field} />
        </label>
      )}
      {state.status === "error" && (
        <p role="alert" className="rounded-2xl bg-tile-pink px-4 py-3 text-sm">
          {state.message}
          {state.daftar && <> <a href={`/daftar?next=${encodeURIComponent(next)}`} className="font-bold underline">Belum punya akun? Daftar</a></>}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${primaryButton} w-full`}>
        {pending ? "Memproses..." : mode === "password" ? "Masuk" : mode === "link" ? "Kirim link masuk" : "Kirim link reset"}
      </button>
      <p className="text-center text-sm text-zinc-400">
        {mode === "password" ? (
          <button type="button" onClick={() => setMode("link")} className={quiet}>Masuk tanpa password, lewat link email</button>
        ) : (
          <button type="button" onClick={() => setMode("password")} className={quiet}>Kembali masuk dengan password</button>
        )}
      </p>
    </form>
  );
}
