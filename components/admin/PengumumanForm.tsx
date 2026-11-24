"use client";

import { BookPlus, CircleCheck, Flame, Megaphone, Mail, Pencil, RefreshCw, Search, Send, ShieldCheck, Sparkles, Wrench, X, type LucideIcon } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import Select from "@/components/ui/Select";
import { confirmDialog } from "@/lib/confirm";
import { rpc } from "@/lib/rpc";
import { field, smallButton } from "./editor";
import { primaryButton, secondaryButton, tile } from "@/components/ui/styles";

const kirim = rpc("kirimPengumuman");
const tes = rpc("kirimTesPengumuman");

export type Person = { id: string; name: string; email: string };

const AUDIENCES = [["all", "Semua pengguna"], ["student", "Hanya siswa"], ["admin", "Hanya admin"], ["users", "Pengguna tertentu"]] as const;
const AUDIENCE_TEXT = { all: "semua pengguna", student: "semua siswa", admin: "semua admin", users: "pengguna yang dipilih" } as const;

type Template = { icon: LucideIcon; hint: string; name: string; title: string; body: string; link: string; audience: keyof typeof AUDIENCE_TEXT };
const TEMPLATES: Template[] = [
  { icon: BookPlus, hint: "Kabarkan kelas yang baru terbit", name: "Kelas baru", title: "Kelas [nama kelas] sudah terbit", body: "Kelas baru sudah tersedia di Ruang Materi: [nama kelas].\n\nCocok untuk kamu yang ingin [tujuan belajar]. Yuk mulai belajar sekarang.", link: "/kelas/[slug-kelas]", audience: "all" },
  { icon: RefreshCw, hint: "Ada bab atau isi yang berubah", name: "Materi diperbarui", title: "Materi [nama kelas] diperbarui", body: "Kami baru saja memperbarui materi di kelas [nama kelas]: [apa yang berubah].\n\nProgres belajarmu tetap aman. Silakan cek bagian yang baru.", link: "/kelas/[slug-kelas]", audience: "student" },
  { icon: Sparkles, hint: "Kenalkan fitur yang baru ada", name: "Fitur baru", title: "Fitur baru: [nama fitur]", body: "Sekarang kamu bisa [apa yang bisa dilakukan].\n\nCara memakainya: [langkah singkat].", link: "", audience: "all" },
  { icon: Wrench, hint: "Situs sempat tidak bisa dibuka", name: "Jadwal pemeliharaan", title: "Pemeliharaan sistem [tanggal]", body: "Pada [tanggal] pukul [jam] WIB, Ruang Materi akan dipelihara sekitar [durasi]. Selama itu situs mungkin tidak bisa diakses.\n\nMohon maaf atas ketidaknyamanannya.", link: "", audience: "all" },
  { icon: CircleCheck, hint: "Kabar bahwa semuanya sudah normal", name: "Gangguan teratasi", title: "Gangguan sudah teratasi", body: "Tadi sempat ada gangguan pada [bagian yang terdampak]. Sekarang sudah pulih dan berjalan normal.\n\nTerima kasih sudah bersabar. Data dan progresmu tidak terpengaruh.", link: "", audience: "all" },
  { icon: Flame, hint: "Dorongan untuk lanjut belajar", name: "Semangat belajar", title: "Ayo lanjutkan belajarmu", body: "Sudah lama tidak belajar? Sedikit demi sedikit tetap berarti. Lanjutkan dari materi terakhirmu hari ini.", link: "/dasbor", audience: "student" },
  { icon: ShieldCheck, hint: "Info atau tugas khusus admin", name: "Untuk admin", title: "Info untuk admin: [topik]", body: "[Sampaikan info atau tugas untuk admin].\n\nBatas waktu: [tanggal].", link: "/admin", audience: "admin" },
];

// [placeholder] parts get a matcha highlighter so the admin sees what to fill in.
const marked = (text: string) => text.split(/(\[[^\]]+\])/).map((part, i) => (part.startsWith("[") ? <mark key={i} className="rounded bg-matcha-300 px-1 text-noir">{part.slice(1, -1)}</mark> : part));

export default function PengumumanForm({ people, emailToday }: { people: Person[]; emailToday: number }) {
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

  const dialog = useRef<HTMLDialogElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Template | null>(null);
  const open = (t: Template) => { setPreview(t); dialog.current?.showModal(); };
  const apply = async (t: Template) => {
    dialog.current?.close();
    if ((title || body) && !(await confirmDialog({ title: "Ganti isi form?", text: "Judul, isi, tautan, dan penerima akan diganti dengan template.", action: "Ganti" }))) return;
    setTitle(t.title); setBody(t.body); setLink(t.link); setAudience(t.audience);
  };

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
      <fieldset>
        <legend className="text-sm text-zinc-400">Mulai dari template, atau tulis sendiri di bawah</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {TEMPLATES.map((t, i) => (
            <button key={t.name} type="button" onClick={() => open(t)} className={`${tile(i)} group flex min-h-24 cursor-pointer flex-col items-start gap-1 rounded-2xl p-3 text-left text-zinc-50 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none`}>
              <t.icon aria-hidden className="size-5" />
              <span className="mt-auto text-sm font-bold leading-tight">{t.name}</span>
              <span className="text-xs leading-snug text-zinc-50/70">{t.hint}</span>
            </button>
          ))}
          <button type="button" onClick={() => titleInput.current?.focus()} className="flex min-h-24 cursor-pointer flex-col items-start gap-1 rounded-2xl border-2 border-dashed border-zinc-700 p-3 text-left text-zinc-50 hover:bg-zinc-800/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <Pencil aria-hidden className="size-5" />
            <span className="mt-auto text-sm font-bold leading-tight">Tulis sendiri</span>
            <span className="text-xs leading-snug text-zinc-400">Mulai dari kosong</span>
          </button>
        </div>
      </fieldset>
      <dialog
        ref={dialog}
        aria-label="Pratinjau template"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-[18px] border-2 border-noir bg-zinc-900 p-0 text-zinc-50 shadow-[6px_6px_0_0_var(--color-noir)] backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        {preview && (
          <div className="grid gap-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-extrabold">{preview.name}</h3>
              <button type="button" aria-label="Tutup" onClick={() => dialog.current?.close()} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-zinc-800 hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-accent"><X aria-hidden className="size-4" /></button>
            </div>
            <div>
              <p className="mb-2 text-xs text-zinc-500">Begini tampilannya di Dashboard murid</p>
              <section className="rounded-[18px] bg-tile-butter p-5 ring-1 ring-zinc-800">
                <p className="flex items-center gap-2 text-sm font-semibold text-zinc-50"><Megaphone aria-hidden className="size-4" />Pengumuman</p>
                <h2 className="mt-2 text-lg font-bold tracking-tight text-zinc-50">{marked(preview.title)}</h2>
                <div className="mt-1 grid gap-2 text-sm leading-relaxed text-zinc-50">{preview.body.split("\n\n").map((para, i) => <p key={i}>{marked(para)}</p>)}</div>
                {preview.link && <span className={`${secondaryButton} mt-4`}>Buka</span>}
              </section>
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              Tautan: <span className="text-zinc-50">{preview.link ? marked(preview.link) : "tidak ada"}</span>. Penerima: <span className="text-zinc-50">{AUDIENCE_TEXT[preview.audience]}</span>. Isi bagian yang disorot setelah template dipakai.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => apply(preview)} className={primaryButton}>Pakai template</button>
              <button type="button" onClick={() => dialog.current?.close()} className={smallButton}>Batal</button>
            </div>
          </div>
        )}
      </dialog>
      <label className="text-sm text-zinc-400">
        Judul
        <input ref={titleInput} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required placeholder="Contoh: Kelas MikroTik sudah terbit" className={`${field} mt-1`} />
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
      {email && <p className="rounded-xl bg-tile-butter p-3 text-xs leading-relaxed text-zinc-50">Email hanya ke akun yang sudah dikonfirmasi dan tidak mematikan email pengumuman. Kuota gratis Resend 100 email per hari.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || !title.trim() || !body.trim() || (audience === "users" && picked.length === 0)} className={primaryButton}><Send aria-hidden className="size-4" />{pending ? "Mengirim..." : "Kirim pengumuman"}</button>
        <button type="button" disabled={pending || !title.trim() || !body.trim()} onClick={() => start(async () => setMsg(await tes(content)))} className={smallButton}><Mail aria-hidden className="size-4" />Kirim tes ke saya</button>
        <p className="text-xs tabular-nums text-zinc-500 sm:ml-auto">Kuota email hari ini: {emailToday}/100 terpakai</p>
      </div>
      <p aria-live="polite" className={`text-sm empty:hidden ${msg.error ? "text-red-500" : "text-accent"}`}>{msg.error ?? msg.ok}</p>
    </form>
  );
}
