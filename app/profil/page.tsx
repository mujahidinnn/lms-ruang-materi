import { Trash2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { aturSandi, hapusAkun, simpanProfil } from "@/app/profil/actions";
import ActionForm from "@/components/admin/ActionForm";
import { field } from "@/components/admin/editor";
import AccountNav from "@/components/dashboard/AccountNav";
import ExportButton from "@/components/dashboard/ExportButton";
import SiteHeader from "@/components/landing/SiteHeader";
import { primaryButton } from "@/components/ui/styles";
import { requireUser } from "@/lib/dal";
import { card } from "@/components/ui/styles";
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
    <div className="relative flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 px-5 pb-20 sm:px-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Profil</h1>
          <div className="mt-5"><AccountNav current="/profil" /></div>
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
      <section aria-labelledby="data" className={`mt-8 p-6 sm:p-8 ${card}`}>
        <h2 id="data" className="text-xl font-bold tracking-tight">Data diri</h2>
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

      <section id="sandi" aria-labelledby="sandi-judul" className={`mt-4 scroll-mt-6 p-6 sm:p-8 ${card}`}>
        <h2 id="sandi-judul" className="text-xl font-bold tracking-tight">Kata sandi</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Opsional. Dengan kata sandi kamu bisa masuk tanpa menunggu email. Lupa? Masuk lewat tautan email, lalu buat yang baru di sini.
        </p>
        <ActionForm action={aturSandi} className="mt-4 grid gap-4">
          <input type="email" name="username" autoComplete="username" value={user.email} readOnly hidden />
          <label className="text-sm text-zinc-400">
            Kata sandi baru
            <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={`${field} mt-1`} />
          </label>
          <label className="text-sm text-zinc-400">
            Ulangi kata sandi
            <input name="confirm" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={`${field} mt-1`} />
          </label>
          <button className={`${primaryButton} justify-self-start`}>Simpan kata sandi</button>
        </ActionForm>
      </section>

      <section aria-labelledby="ekspor" className="mt-4 rounded-[28px] bg-tile-sky p-6 sm:p-8">
        <h2 id="ekspor" className="text-xl font-bold tracking-tight">Ekspor data</h2>
        <p className="mt-1 mb-4 text-sm text-zinc-300">Semua data belajarmu dalam satu file JSON: progres, latihan, flashcard, ujian, dan lencana.</p>
        <ExportButton />
      </section>

      <section aria-labelledby="hapus" className="mt-4 rounded-[28px] bg-tile-pink p-6 sm:p-8">
        <h2 id="hapus" className="text-xl font-bold tracking-tight">Hapus akun</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Semua data belajarmu ikut terhapus dan tidak bisa dikembalikan. Ketik email akunmu untuk memastikan.
        </p>
        <ActionForm action={hapusAkun} className="mt-4 flex flex-wrap gap-2">
          <input name="email" type="email" required autoComplete="off" aria-label="Email akun" placeholder={user.email} className={`${field} flex-1`} />
          <button className="inline-flex min-h-12 items-center gap-2 rounded-full bg-red-600 px-6 font-semibold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
            <Trash2 aria-hidden className="size-4" />
            Hapus akun
          </button>
        </ActionForm>
      </section>
    </>
  );
}
