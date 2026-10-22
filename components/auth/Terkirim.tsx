"use client";

import { MailCheck, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { secondaryButton } from "@/components/ui/styles";
import type { MasukState } from "@/lib/actions/masuk";

const WHAT = {
  link: { title: "Cek emailmu", text: "Klik link di email itu dan kamu langsung masuk." },
  konfirmasi: { title: "Konfirmasi emailmu", text: "Klik link di email itu untuk mengaktifkan akun, lalu kamu langsung masuk." },
  reset: { title: "Cek emailmu", text: "Kalau email ini terdaftar, kami kirim link untuk membuat password baru." },
};

// After an email went out: where to, what to do, and a way to send it again
// (after 60 s, the same limit Supabase applies) or fix the address.
export default function Terkirim({ state, onResend, onBack, busy }: { state: MasukState; onResend: () => void; onBack: () => void; busy: boolean }) {
  const [wait, setWait] = useState(60);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  const what = WHAT[state.kind ?? "link"];
  return (
    <div role="status" className="grid gap-4">
      <span className="grid size-14 -rotate-6 place-items-center rounded-2xl border-2 border-noir bg-matcha-300 text-noir"><MailCheck aria-hidden className="size-7" /></span>
      <div>
        <p className="text-2xl font-extrabold tracking-tight">{what.title}</p>
        <p className="mt-1 text-zinc-300">Kami kirim email ke <strong className="text-zinc-50">{state.email}</strong>. {what.text}</p>
      </div>
      <ul className="grid gap-1 rounded-2xl bg-zinc-800/60 p-4 text-sm text-zinc-400">
        <li>Belum masuk? Cek folder <strong>Spam</strong> atau <strong>Promosi</strong>.</li>
        <li>Link berlaku 1 jam dan hanya bisa dipakai sekali.</li>
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={wait > 0 || busy} onClick={() => { onResend(); setWait(60); }} className={`${secondaryButton} disabled:opacity-50`}>
          <RotateCw aria-hidden className="size-4" />{wait > 0 ? `Kirim ulang (${wait})` : busy ? "Mengirim..." : "Kirim ulang"}
        </button>
        <button type="button" onClick={onBack} className="min-h-11 rounded-full px-4 text-sm font-semibold text-zinc-400 hover:text-zinc-50">Ganti email</button>
      </div>
    </div>
  );
}
