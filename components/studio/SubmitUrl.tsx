"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { field } from "@/components/admin/editor";
import { primaryButton, secondaryButton } from "@/components/ui/styles";
import { cleanStudioUrl } from "@/lib/studio/url";
import { createClient } from "@/lib/supabase/client";

// The finished site's address. It shows on the public profile when the learner
// has one; only https addresses are accepted (also checked by the table).
export default function SubmitUrl({ project, saved, handle }: { project: string; saved: string | null; handle: string | null }) {
  const [url, setUrl] = useState(saved ?? "");
  const [current, setCurrent] = useState(saved);
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const clean = cleanStudioUrl(url);
    if (!clean) return setMsg({ error: "Tempel alamat lengkap yang diawali https://, misalnya https://namamu.github.io." });
    setBusy(true);
    const db = createClient();
    const { data } = await db.auth.getSession();
    const uid = data.session?.user.id;
    const { error } = uid
      ? await db.from("studio_projects").upsert({ user_id: uid, project, url: clean, updated_at: new Date().toISOString() }, { onConflict: "user_id,project" })
      : { error: new Error("no session") };
    setBusy(false);
    if (error) return setMsg({ error: "Gagal menyimpan. Coba lagi." });
    setUrl(clean);
    setCurrent(clean);
    setMsg({ ok: handle ? "Tersimpan. Alamat ini tampil di profil publikmu." : "Tersimpan. Aktifkan profil publik di Profil agar alamat ini tampil di sana." });
  }

  async function remove() {
    const db = createClient();
    const { data, error } = await db.from("studio_projects").delete().eq("project", project).select();
    if (error) return setMsg({ error: "Gagal menghapus." });
    // A row an admin hid cannot be deleted by its owner, so nothing comes back.
    if (!data?.length) return setMsg({ error: "Alamat ini tidak bisa dihapus. Hubungi admin lewat halaman Masukan dan saran." });
    setUrl("");
    setCurrent(null);
    setMsg({ ok: "Dihapus dari profilmu." });
  }

  return (
    <form onSubmit={save} className="grid gap-3">
      <label className="text-sm text-zinc-400">
        <span className="font-semibold text-zinc-300">Alamat situs yang sudah online</span>
        <input value={url} onChange={(e) => setUrl(e.target.value)} type="url" inputMode="url" maxLength={300} placeholder="https://namamu.github.io/portofolio" className={`${field} mt-1 w-full`} />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button disabled={busy || !url.trim()} className={primaryButton}>{current ? "Perbarui alamat" : "Simpan alamat"}</button>
        {current && (
          <>
            <a href={current} target="_blank" rel="nofollow noopener noreferrer" className={secondaryButton}><ExternalLink aria-hidden className="size-4" />Buka situsmu</a>
            <button type="button" onClick={remove} className="min-h-11 rounded-full px-4 text-sm font-medium text-zinc-400 hover:text-zinc-50">Hapus</button>
          </>
        )}
      </div>
      <p aria-live="polite" className={`text-sm empty:hidden ${msg.error ? "text-red-500" : "text-accent"}`}>{msg.error ?? msg.ok}</p>
    </form>
  );
}
