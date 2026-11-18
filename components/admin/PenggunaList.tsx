"use client";

import { ClipboardList, Clock, RefreshCw, Search, ShieldMinus, ShieldPlus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  reload.current = refresh;
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
      <ActionForm action="undangPengguna" className="mt-6 flex flex-wrap items-center gap-3">
        <label className="min-w-56 flex-1">
          <span className="sr-only">Email yang diundang</span>
          <input type="email" name="email" required placeholder="Undang lewat email, mis. nama@gmail.com" className={field} />
        </label>
        <button type="submit" className={`${smallButton} min-h-12`}>Kirim undangan</button>
      </ActionForm>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Cari nama atau email</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-500" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau email" className={`${field} pl-11`} />
        </label>
        <div className="w-full sm:w-64"><Select prefix label="Urutkan" value={sort} options={SORTS} onChange={(v) => setSort(v as typeof sort)} /></div>
        <button type="button" onClick={refresh} disabled={busy} className={`${chip} min-h-12 cursor-pointer gap-2 bg-zinc-800 hover:bg-zinc-700`}>
          <RefreshCw aria-hidden className={`size-4 ${busy ? "animate-spin" : ""}`} />
          Segarkan
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Saring">
        {FILTERS.map(([key, label, test]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={`${chip} min-h-10 cursor-pointer ${filter === key ? "bg-primary font-semibold text-on-primary" : "bg-zinc-800 hover:bg-zinc-700"}`}
          >
            {label}
            <span className="tabular-nums opacity-70">{people.filter(test).length}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-[28px] bg-zinc-900 p-8 text-center text-zinc-400 shadow-soft">
          Tidak ada akun yang cocok.{" "}
          <button type="button" className="text-accent hover:underline" onClick={() => { setQ(""); setFilter("semua"); }}>Reset pencarian</button>
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-800 rounded-[28px] bg-zinc-900 px-5 shadow-soft">
          {shown.map((p) => (
            <li key={p.id} className="grid items-center gap-x-4 gap-y-3 py-4 sm:grid-cols-[minmax(0,1fr)_5rem_12rem_17.5rem]">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={p.name} src={p.avatar} admin={p.admin} />
                <div className="min-w-0">
                  <p className="truncate font-medium"><a href={`/admin/pengguna/${p.id}`} className="hover:text-accent">{p.name}</a>{p.me && <span className="ml-2 text-xs font-normal text-zinc-500">kamu</span>}</p>
                  <p className="truncate text-sm text-zinc-400">{p.email}</p>
                </div>
              </div>
              <span className={`${chip} w-fit ${p.admin ? "bg-tile-mint text-zinc-50" : "bg-zinc-800"}`}>{p.admin ? "Admin" : "Siswa"}</span>
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
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <a href={`/admin/pengguna/${p.id}`} className={smallButton}><ClipboardList aria-hidden className="size-4" />Rekap</a>
                {!p.me && (
                  <ActionForm
                    action="gantiRole"
                    data-confirm={p.admin ? `Jadikan ${p.name} siswa?` : `Jadikan ${p.name} admin?`}
                    data-confirm-text={p.admin ? "Akses ke halaman admin dicabut." : "Admin bisa mengubah dan menerbitkan semua materi."}
                    data-confirm-action={p.admin ? "Jadikan siswa" : "Jadikan admin"}
                    data-confirm-danger={p.admin ? true : undefined}
                  >
                    <input type="hidden" name="user_id" value={p.id} />
                    <input type="hidden" name="role" value={p.admin ? "student" : "admin"} />
                    <button className={smallButton}>{p.admin ? <ShieldMinus aria-hidden className="size-4" /> : <ShieldPlus aria-hidden className="size-4" />}{p.admin ? "Jadikan siswa" : "Jadikan admin"}</button>
                  </ActionForm>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
