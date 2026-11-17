"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { chip } from "@/components/ui/styles";
import ActionForm from "./ActionForm";
import { field, smallButton } from "./editor";

export type Person = {
  id: string;
  name: string;
  email: string;
  admin: boolean;
  me: boolean;
  pending: boolean; // invited, not accepted yet
  provider: string;
  joined: string;
  joinedAt: number;
  seen: string;
  seenAt: number;
};

const FILTERS = [
  ["semua", "Semua", () => true],
  ["admin", "Admin", (p: Person) => p.admin],
  ["siswa", "Siswa", (p: Person) => !p.admin],
  ["undangan", "Belum diterima", (p: Person) => p.pending],
] as const;
const SORTS = { baru: "Terbaru daftar", masuk: "Terakhir masuk", nama: "Nama A-Z" } as const;

export default function PenggunaList({ people }: { people: Person[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("semua");
  const [sort, setSort] = useState<keyof typeof SORTS>("baru");

  const shown = useMemo(() => {
    const test = FILTERS.find((f) => f[0] === filter)![2];
    const term = q.trim().toLowerCase();
    return people
      .filter((p) => test(p) && (!term || `${p.name} ${p.email}`.toLowerCase().includes(term)))
      .sort((a, b) => (sort === "nama" ? a.name.localeCompare(b.name) : sort === "masuk" ? b.seenAt - a.seenAt : b.joinedAt - a.joinedAt));
  }, [people, q, filter, sort]);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Cari nama atau email</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-500" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau email" className={`${field} pl-11`} />
        </label>
        <label className="text-sm text-zinc-400">
          <span className="sr-only">Urutkan</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} className={`${field} w-auto`}>
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
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
            <li key={p.id} className="grid items-center gap-x-4 gap-y-3 py-4 sm:grid-cols-[minmax(0,1fr)_5rem_11rem_15.5rem]">
              <div className="flex min-w-0 items-center gap-3">
                <span aria-hidden className={`grid size-11 shrink-0 place-items-center rounded-2xl text-base font-bold ${p.admin ? "bg-primary text-on-primary" : "bg-zinc-800 text-zinc-300"}`}>
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium"><a href={`/admin/pengguna/${p.id}`} className="hover:text-accent">{p.name}</a>{p.me && <span className="ml-2 text-xs font-normal text-zinc-500">kamu</span>}</p>
                  <p className="truncate text-sm text-zinc-400">{p.email}</p>
                </div>
              </div>
              <span className={`${chip} w-fit ${p.admin ? "bg-tile-mint text-zinc-50" : "bg-zinc-800"}`}>{p.admin ? "Admin" : "Siswa"}</span>
              <div className="text-sm leading-snug">
                <p className={p.pending ? "text-accent-warm" : "text-zinc-300"}>{p.pending ? "Undangan belum diterima" : p.seen}</p>
                <p className="text-xs text-zinc-500">Daftar {p.joined}, {p.provider === "google" ? "Google" : "email"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <a href={`/admin/pengguna/${p.id}`} className={smallButton}>Rekap</a>
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
                    <button className={smallButton}>{p.admin ? "Jadikan siswa" : "Jadikan admin"}</button>
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
