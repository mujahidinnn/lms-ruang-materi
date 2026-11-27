"use client";

import { ClipboardList, Clock, Loader2, MoreHorizontal, RefreshCw, Search, ShieldMinus, ShieldPlus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { chip } from "@/components/ui/styles";
import type { Person } from "@/lib/pengguna";
import { rpc } from "@/lib/rpc";
import ActionForm from "./ActionForm";
import Avatar from "./Avatar";
import Select from "@/components/ui/Select";
import { field, smallButton } from "./editor";

export type { Person };

const FILTERS = [
  ["semua", "Semua", () => true],
  ["admin", "Admin", (p: Person) => p.admin],
  ["siswa", "Siswa", (p: Person) => !p.admin],
  ["undangan", "Belum diterima", (p: Person) => p.pending],
] as const;
const SORTS = [["baru", "Terbaru daftar"], ["masuk", "Terakhir akses"], ["nama", "Nama A-Z"]] as const;

const ITEM = "flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-sm hover:bg-zinc-800 focus-visible:bg-zinc-800 focus-visible:outline-none";

const info = (p: Person) =>
  [`Email: ${p.email}`, `Role: ${p.admin ? "Admin" : "Siswa"}`, `Daftar: ${p.joined}`, `Akses terakhir: ${p.pending ? "belum pernah" : p.seenFull || p.seen}`, `Mengajak: ${p.invited} orang`].join("\n");

// Menu item that shows progress while its form runs (the confirm dialog is
// already closed by then), and stays disabled until the page reloads.
function Item({ icon, label, busyLabel, className = "" }: { icon: ReactNode; label: string; busyLabel: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button role="menuitem" disabled={pending} className={`${ITEM} disabled:cursor-wait disabled:opacity-70 ${className}`}>
      {pending ? <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" /> : icon}
      {pending ? busyLabel : label}
    </button>
  );
}

// "Aksi" dropdown: change role, delete. Forms stay mounted while it is open,
// so the confirm dialog (lib/confirm.ts) can submit them.
function RowMenu({ p }: { p: Person }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && !(e.target as Element).closest("dialog") && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div ref={root} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={`Aksi untuk ${p.name}`} onClick={() => setOpen((o) => !o)} className={smallButton}>
        <MoreHorizontal aria-hidden className="size-4" />Aksi
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-soft">
          <ActionForm
            action="gantiRole"
            data-confirm={p.admin ? `Jadikan ${p.name} siswa?` : `Jadikan ${p.name} admin?`}
            data-confirm-text={p.admin ? `${info(p)}\n\nAkses ke halaman admin dicabut.` : `${info(p)}\n\nDia akan bisa mengubah, menerbitkan, dan menghapus semua materi, serta mengelola pengguna lain.`}
            data-confirm-action={p.admin ? "Jadikan siswa" : "Jadikan admin"}
            data-confirm-danger={p.admin ? true : undefined}
            data-confirm-twice-title={`Benar-benar jadikan ${p.name} admin?`}
            data-confirm-twice={p.admin ? undefined : "Beri akses admin hanya ke orang yang kamu percaya. Kamu bisa mencabutnya lagi kapan saja."}
          >
            <input type="hidden" name="user_id" value={p.id} />
            <input type="hidden" name="role" value={p.admin ? "student" : "admin"} />
            <Item icon={p.admin ? <ShieldMinus aria-hidden className="size-4" /> : <ShieldPlus aria-hidden className="size-4" />} label={p.admin ? "Jadikan siswa" : "Jadikan admin"} busyLabel="Menyimpan…" />
          </ActionForm>
          <ActionForm
            action="hapusPengguna"
            data-confirm={`Hapus ${p.name}?`}
            data-confirm-text={`${info(p)}\n\nAkun dihapus beserta progres belajar, nilai ujian, dan sertifikatnya.${p.invited > 0 ? " Orang yang dia ajak tetap ada, tapi tidak lagi tercatat diajak olehnya." : ""}`}
            data-confirm-action="Hapus pengguna"
            data-confirm-danger
            data-confirm-twice-title={`Hapus ${p.name} selamanya?`}
            data-confirm-twice="Data tidak bisa dikembalikan. Untuk punya akun lagi, orang ini harus daftar atau diundang ulang."
          >
            <input type="hidden" name="user_id" value={p.id} />
            <Item icon={<Trash2 aria-hidden className="size-4" />} label="Hapus pengguna" busyLabel="Menghapus…" className="text-red-500" />
          </ActionForm>
        </div>
      )}
    </div>
  );
}

export default function PenggunaList({ people: first }: { people: Person[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("semua");
  const [sort, setSort] = useState<(typeof SORTS)[number][0]>("baru");

  // Reloads the list through an action, so search and filter stay as they
  // are. Every 4 minutes while the tab is visible, so Online stays current.
  const [people, setPeople] = useState(first);
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true);
    try { setPeople(await rpc("daftarPengguna")()); } catch {}
    setBusy(false);
  }
  const reload = useRef(refresh);
  useEffect(() => { reload.current = refresh; });
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) reload.current(); }, 24e4);
    return () => clearInterval(t);
  }, []);

  const shown = useMemo(() => {
    const test = FILTERS.find((f) => f[0] === filter)![2];
    const term = q.trim().toLowerCase();
    return people
      .filter((p) => test(p) && (!term || `${p.name} ${p.email}`.toLowerCase().includes(term)))
      .sort((a, b) => (sort === "nama" ? a.name.localeCompare(b.name) : sort === "masuk" ? b.seenAt - a.seenAt : b.joinedAt - a.joinedAt));
  }, [people, q, filter, sort]);

  return (
    <>
      <ActionForm action="undangPengguna" className="mt-4 flex items-center gap-2 sm:mt-6 sm:flex-wrap sm:gap-3">
        <label className="min-w-0 flex-1 sm:min-w-56">
          <span className="sr-only">Email yang diundang</span>
          <input type="email" name="email" required placeholder="Undang lewat email" className={field} />
        </label>
        <button type="submit" className={`${smallButton} min-h-12`}>Kirim undangan</button>
      </ActionForm>
      <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4 sm:gap-3">
        <label className="relative min-w-56 basis-full flex-1 sm:basis-auto">
          <span className="sr-only">Cari nama atau email</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-500" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau email" className={`${field} pl-11`} />
        </label>
        <div className="min-w-0 flex-1 sm:w-64 sm:flex-none"><Select prefix label="Urutkan" value={sort} options={SORTS} onChange={(v) => setSort(v as typeof sort)} /></div>
        <button type="button" onClick={refresh} disabled={busy} className={`${chip} min-h-12 cursor-pointer gap-2 bg-zinc-800 hover:bg-zinc-700`}>
          <RefreshCw aria-hidden className={`size-4 ${busy ? "animate-spin" : ""}`} />
          Segarkan
        </button>
      </div>
      <div className="scrollbar-thin -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Saring">
        {FILTERS.map(([key, label, test]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={`${chip} min-h-10 shrink-0 cursor-pointer ${filter === key ? "bg-primary font-semibold text-on-primary!" : "bg-zinc-800 hover:bg-zinc-700"}`}
          >
            {label}
            <span className="tabular-nums opacity-70">{people.filter(test).length}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-zinc-900 p-8 text-center text-zinc-400 shadow-soft">
          Tidak ada akun yang cocok.{" "}
          <button type="button" className="text-accent hover:underline" onClick={() => { setQ(""); setFilter("semua"); }}>Reset pencarian</button>
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-800 rounded-2xl bg-zinc-900 px-4 shadow-soft sm:rounded-2xl sm:px-5">
          {shown.map((p) => (
            <li key={p.id} className="relative grid items-center gap-x-4 gap-y-2 py-3 sm:gap-y-3 sm:py-4 sm:grid-cols-[minmax(0,1fr)_5rem_12rem_17.5rem]">
              <div className="flex min-w-0 items-center gap-3 max-sm:pr-16">
                <Avatar name={p.name} src={p.avatar} admin={p.admin} />
                <div className="min-w-0">
                  <p className="truncate font-medium"><a href={`/admin/pengguna/${p.id}`} className="hover:text-accent">{p.name}</a>{p.me && <span className="ml-2 text-xs font-normal text-zinc-500">kamu</span>}</p>
                  <p className="truncate text-sm text-zinc-400">{p.email}</p>
                </div>
              </div>
              <span className={`${chip} w-fit max-sm:absolute max-sm:top-3 max-sm:right-0 ${p.admin ? "bg-tile-mint text-zinc-50" : "bg-zinc-800"}`}>{p.admin ? "Admin" : "Siswa"}</span>
              <div className="text-sm leading-snug">
                {p.pending ? (
                  <p className="text-accent-warm">Undangan belum diterima</p>
                ) : (
                  <>
                    <p className="flex items-center gap-1.5 text-zinc-300">
                      {p.online ? <span aria-hidden className="size-2 shrink-0 rounded-full bg-brand ring-4 ring-brand/20" /> : <Clock aria-hidden className="size-3.5 shrink-0 text-zinc-500" />}
                      <span className="sr-only">Terakhir akses: </span>
                      <span className={p.online ? "font-semibold text-accent" : ""}>{p.online ? "Online" : p.seen}</span>
                    </p>
                    {p.seenFull && !p.online && <p className="mt-0.5 text-xs text-zinc-500">Akses terakhir {p.seenFull}</p>}
                  </>
                )}
                <p className="mt-0.5 text-xs text-zinc-500">Daftar {p.joined} · {p.provider.split(",").map((v) => (v === "google" ? "Google" : v === "email" ? "Email" : v)).join(" + ")}</p>
                {(p.referredBy || p.invited > 0) && (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {[p.referredBy && `Diajak ${p.referredBy}`, p.invited > 0 && `Mengajak ${p.invited} orang`].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <a href={`/admin/pengguna/${p.id}`} className={smallButton}><ClipboardList aria-hidden className="size-4" />Rekap</a>
                {!p.me && <RowMenu p={p} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
