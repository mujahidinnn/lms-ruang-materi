"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import type { MasukState } from "@/lib/actions/masuk";
import { primaryButton } from "@/components/ui/styles";
import { rpc } from "@/lib/rpc";
import { field } from "./MasukForm";
import PasswordInput from "./PasswordInput";
import Terkirim from "./Terkirim";

const daftar = rpc("daftar");
const label = "grid content-start gap-1.5 text-sm font-medium text-zinc-300";
const USIA = [
  { value: "dewasa", title: "18+ tahun" },
  { value: "anak", title: "Di bawah 18" },
];
const hint = "text-xs font-normal text-zinc-500";

// Daftar: name, email, password (or a link instead) and the age choice, so
// the account is ready in one step.
export default function DaftarForm({ next }: { next: string }) {
  const [tanpaPassword, setTanpaPassword] = useState(false);
  const last = useRef<FormData | null>(null);
  const [state, action, pending] = useActionState<MasukState, FormData>((s, form) => {
    if (form.get("reset")) return Promise.resolve<MasukState>({ status: "idle" });
    last.current = form;
    return daftar(s, form) as Promise<MasukState>;
  }, { status: "idle" });

  if (state.status === "sent") {
    return (
      <Terkirim
        state={state}
        busy={pending}
        onResend={() => last.current && startTransition(() => action(last.current!))}
        onBack={() => startTransition(() => { const f = new FormData(); f.set("reset", "1"); action(f); })}
      />
    );
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <h2 className="text-2xl font-extrabold tracking-tight">Buat akun gratis</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Nama tampilan
          <input name="nama" required maxLength={80} autoComplete="name" placeholder="Nama panggilan juga boleh" defaultValue={last.current?.get("nama")?.toString()} className={field} />
          <span className={hint}>Muncul di sertifikatmu.</span>
        </label>
        <label className={label}>
          Email
          <input name="email" type="email" required autoComplete="email" placeholder="kamu@email.com" defaultValue={last.current?.get("email")?.toString()} className={field} />
        </label>
      </div>
      {!tanpaPassword && (
        <label className={label}>
          Password
          <PasswordInput name="password" required minLength={8} maxLength={72} autoComplete="new-password" placeholder="Minimal 8 karakter" className={field} />
        </label>
      )}
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-medium text-zinc-300">Usia</legend>
        <div className="grid grid-cols-2 gap-2">
          {USIA.map((u) => (
            <label key={u.value} className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-2xl border-2 border-transparent bg-zinc-800/60 px-3.5 text-sm font-semibold text-zinc-300 has-checked:border-noir has-checked:bg-matcha-100 has-checked:text-noir">
              <input type="radio" name="usia" value={u.value} required defaultChecked={last.current?.get("usia") === u.value} className="size-4 shrink-0 accent-(--accent)" />
              {u.title}
            </label>
          ))}
        </div>
        <span className={hint}>Di bawah 18 tahun? Pastikan orang tua atau wali sudah mengizinkan.</span>
      </fieldset>
      {state.status === "error" && (
        <p role="alert" className="rounded-2xl bg-tile-pink px-4 py-3 text-sm">
          {state.message}
          {state.message?.includes("sudah terdaftar") && <> <a href={`/masuk?next=${encodeURIComponent(next)}`} className="font-bold underline">Masuk</a></>}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${primaryButton} w-full`}>
        {pending ? "Memproses..." : tanpaPassword ? "Kirim link pendaftaran" : "Daftar"}
      </button>
      <p className="text-center text-sm text-zinc-400">
        <button type="button" onClick={() => setTanpaPassword((v) => !v)} className="font-semibold text-accent hover:underline">
          {tanpaPassword ? "Daftar dengan password" : "Daftar tanpa password, lewat link email"}
        </button>
      </p>
      <p className="text-xs text-zinc-500">Dengan mendaftar, kamu menyetujui <a href="/privasi" className="text-accent underline">Kebijakan Privasi</a>.</p>
    </form>
  );
}
