import type { Metadata } from "next";
import { Suspense } from "react";
import { hapusAkun, simpanProfil } from "@/app/profil/actions";
import PageBackdrop from "@/components/PageBackdrop";
import ActionForm from "@/components/admin/ActionForm";
import { field } from "@/components/admin/editor";
import AccountNav from "@/components/dashboard/AccountNav";
import ExportButton from "@/components/dashboard/ExportButton";
import SiteHeader from "@/components/landing/SiteHeader";
import { primaryButton } from "@/components/ui/styles";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profil",
  description: "Ubah nama dan zona waktu, unduh data belajarmu, atau hapus akun.",
  robots: { index: false },
};

const INDONESIA = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"];
const ZONES = [...INDONESIA, ...Intl.supportedValuesOf("timeZone").filter((z) => !INDONESIA.includes(z))];

export default function ProfilPage() {
  return (
    <div className="relative">
      <PageBackdrop />
      <SiteHeader />
      <main className="px-6 pb-20 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight">Profil</h1>
            <AccountNav current="/profil" />
          </div>
          <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">Memuat...</p>}>
            <Profil />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function Profil() {
  const user = await requireUser("/profil");
  const { data: p } = await (await createClient())
    .from("profiles")
    .select("display_name, timezone, guardian_consent")
    .eq("user_id", user.id)
    .single();

  return (
    <>
      <section aria-labelledby="data" className="mt-10">
        <h2 id="data" className="text-lg font-semibold">Data diri</h2>
        <p className="mt-1 text-sm text-zinc-400">{user.email}</p>
        <ActionForm action={simpanProfil} className="mt-4 grid gap-4">
          <label className="text-sm text-zinc-400">
            Nama tampilan
            <input name="display_name" maxLength={80} defaultValue={p?.display_name ?? ""} className={`${field} mt-1`} />
          </label>
          <label className="text-sm text-zinc-400">
            Zona waktu, untuk menghitung streak harian
            <select name="timezone" defaultValue={p?.timezone ?? "Asia/Jakarta"} className={`${field} mt-1`}>
              {ZONES.map((z) => <option key={z}>{z}</option>)}
            </select>
          </label>
          <label className="flex min-h-11 items-start gap-3 text-sm text-zinc-300">
            <input type="checkbox" name="guardian_consent" defaultChecked={p?.guardian_consent} className="mt-0.5 size-4 accent-(--accent)" />
            Saya berusia 18 tahun ke atas, atau orang tua atau wali saya sudah setuju saya memakai Ruang Materi.
          </label>
          <button className={`${primaryButton} justify-self-start`}>Simpan</button>
        </ActionForm>
      </section>

      <section aria-labelledby="ekspor" className="mt-12">
        <h2 id="ekspor" className="text-lg font-semibold">Ekspor data</h2>
        <p className="mt-1 mb-4 text-sm text-zinc-400">Semua data belajarmu dalam satu file JSON: progres, latihan, flashcard, ujian, dan lencana.</p>
        <ExportButton />
      </section>

      <section aria-labelledby="hapus" className="mt-12 rounded-2xl border border-red-500/30 p-6">
        <h2 id="hapus" className="text-lg font-semibold">Hapus akun</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Semua data belajarmu ikut terhapus dan tidak bisa dikembalikan. Ketik email akunmu untuk memastikan.
        </p>
        <ActionForm action={hapusAkun} className="mt-4 flex flex-wrap gap-2">
          <input name="email" type="email" required autoComplete="off" aria-label="Email akun" placeholder={user.email} className={`${field} flex-1`} />
          <button className="inline-flex min-h-11 items-center rounded-lg bg-red-600 px-4 font-medium text-white hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-red-500">
            Hapus akun
          </button>
        </ActionForm>
      </section>
    </>
  );
}
