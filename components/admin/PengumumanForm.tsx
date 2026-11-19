"use client";

import { Mail, Search, Send } from "lucide-react";
import { useState, useTransition } from "react";
import Select from "@/components/ui/Select";
import { confirmDialog } from "@/lib/confirm";
import { rpc } from "@/lib/rpc";
import { field, smallButton } from "./editor";
import { primaryButton } from "@/components/ui/styles";

const kirim = rpc("kirimPengumuman");
const tes = rpc("kirimTesPengumuman");

export type Person = { id: string; name: string; email: string };

const AUDIENCES = [["all", "Semua pengguna"], ["student", "Hanya siswa"], ["admin", "Hanya admin"], ["users", "Pengguna tertentu"]] as const;
const AUDIENCE_TEXT = { all: "semua pengguna", student: "semua siswa", admin: "semua admin", users: "pengguna yang dipilih" } as const;

export default function PengumumanForm({ people }: { people: Person[] }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState<keyof typeof AUDIENCE_TEXT>("all");
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [web, setWeb] = useState(true);
  const [email, setEmail] = useState(false);
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});
  const [pending, start] = useTransition();
  const content = { title, body, link };
  const term = q.trim().toLowerCase();
  const matches = people.filter((p) => !term || `${p.name} ${p.email}`.toLowerCase().includes(term));
  const toggle = (id: string) => setPicked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const submit = () =>
    start(async () => {
      const where = [web && "banner di Dashboard", email && "email"].filter(Boolean).join(" dan ");
      const go = await confirmDialog({
        title: "Kirim pengumuman ini?",
        text: `Dikirim ke ${audience === "users" ? `${picked.length} pengguna yang dipilih` : AUDIENCE_TEXT[audience]} lewat ${where || "tidak ada saluran"}. Email yang sudah terkirim tidak bisa ditarik kembali.`,
        action: "Kirim",
      });
      if (go) setMsg(await kirim({ ...content, audience, userIds: picked, web, email }));
    });

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid gap-4 rounded-[18px] bg-zinc-900 p-5 shadow-soft sm:p-6">
      <label className="text-sm text-zinc-400">
        Judul
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required placeholder="Contoh: Kelas MikroTik sudah terbit" className={`${field} mt-1`} />
      </label>
      <label className="text-sm text-zinc-400">
        <span className="flex justify-between">Isi<span className="tabular-nums text-zinc-500">{body.length}/2000</span></span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} required rows={6} placeholder="Tulis pengumuman. Baris kosong memulai paragraf baru." className={`${field} mt-1 leading-relaxed`} />
      </label>
      <label className="text-sm text-zinc-400">
        Tautan (opsional)
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/kelas/mikrotik-routeros-dasar atau https://..." className={`${field} mt-1`} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="text-sm text-zinc-400">
          Penerima
          <Select label="Penerima" value={audience} options={AUDIENCES} onChange={(v) => setAudience(v as typeof audience)} className="mt-1" />
        </div>
        <fieldset className="text-sm text-zinc-400">
          <legend>Kirim lewat</legend>
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
            <label className="flex min-h-11 items-center gap-2 text-zinc-50"><input type="checkbox" checked={web} onChange={(e) => setWeb(e.target.checked)} className="size-4 accent-[var(--color-brand)]" />Website</label>
            <label className="flex min-h-11 items-center gap-2 text-zinc-50"><input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="size-4 accent-[var(--color-brand)]" />Email</label>
          </div>
        </fieldset>
      </div>
      {audience === "users" && (
        <div className="rounded-xl border border-zinc-800 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-w-0 flex-1 basis-48 items-center gap-2 rounded-xl bg-zinc-800/60 px-3">
              <Search aria-hidden className="size-4 shrink-0 text-zinc-500" />
              <span className="sr-only">Cari pengguna</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau email" className="min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-zinc-500" />
            </label>
            <button type="button" onClick={() => setPicked((c) => [...new Set([...c, ...matches.map((p) => p.id)])])} className={smallButton}>Pilih yang tampil</button>
            <button type="button" onClick={() => setPicked([])} className={smallButton}>Kosongkan</button>
          </div>
          <p className="mt-2 text-xs tabular-nums text-zinc-500">{picked.length} dipilih dari {people.length}</p>
          <ul className="mt-2 grid max-h-64 gap-0.5 overflow-y-auto">
            {matches.map((p) => (
              <li key={p.id}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 hover:bg-zinc-800/60">
                  <input type="checkbox" checked={picked.includes(p.id)} onChange={() => toggle(p.id)} className="size-4 accent-[var(--color-brand)]" />
                  <span className="min-w-0 text-sm"><span className="block truncate">{p.name}</span><span className="block truncate text-xs text-zinc-500">{p.email}</span></span>
                </label>
              </li>
            ))}
            {matches.length === 0 && <li className="px-2 py-3 text-sm text-zinc-500">Tidak ada pengguna yang cocok.</li>}
          </ul>
        </div>
      )}
      {email && <p className="rounded-xl bg-tile-butter p-3 text-xs leading-relaxed text-zinc-700">Email hanya ke akun yang sudah dikonfirmasi dan tidak mematikan email pengumuman. Kuota gratis Resend 100 email per hari.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || !title.trim() || !body.trim() || (audience === "users" && picked.length === 0)} className={primaryButton}><Send aria-hidden className="size-4" />{pending ? "Mengirim..." : "Kirim pengumuman"}</button>
        <button type="button" disabled={pending || !title.trim() || !body.trim()} onClick={() => start(async () => setMsg(await tes(content)))} className={smallButton}><Mail aria-hidden className="size-4" />Kirim tes ke saya</button>
      </div>
      <p aria-live="polite" className={`text-sm empty:hidden ${msg.error ? "text-red-500" : "text-accent"}`}>{msg.error ?? msg.ok}</p>
    </form>
  );
}
