import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privasi",
  description:
    "Data apa yang disimpan Ruang Materi, untuk apa, di mana, dan cara mengekspor atau menghapusnya sesuai UU PDP.",
  alternates: { canonical: `${SITE_URL}/privasi` },
};

const processors = [
  ["Supabase", "akun, progres belajar, dan materi", "Korea Selatan (ap-northeast-2)"],
  ["Vercel", "hosting situs dan statistik kunjungan anonim (halaman yang dibuka, tanpa cookie dan tanpa data akun)", "global, data diproses di server terdekat"],
  ["GitHub", "memproses file materi yang diunggah admin", "Amerika Serikat"],
  ["Anthropic, OpenAI, Google", "membuat draf materi dari slide yang diunggah admin, tidak pernah data pelajar", "Amerika Serikat"],
  ["OpenRouter", "meneruskan slide yang diunggah admin ke model AI pilihan admin untuk membuat draf, tidak pernah data pelajar", "Amerika Serikat"],
];

export default function PrivasiPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 text-zinc-300">
      <h1 className="text-3xl font-semibold text-zinc-50">Privasi</h1>
      <p className="mt-4">
        {SITE_NAME} menyimpan data sesedikit mungkin, sesuai Undang-Undang
        Pelindungan Data Pribadi (UU PDP).
      </p>

      <h2 className="mt-10 text-xl font-semibold text-zinc-50">Data yang disimpan</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        <li>Email, untuk mengirim tautan masuk.</li>
        <li>Nama tampilan dan zona waktu, untuk profil dan menghitung streak harian.</li>
        <li>Aktivitas belajar: progres topik, review flashcard, latihan, dan nilai ujian.</li>
        <li>Persetujuan orang tua atau wali, untuk pelajar di bawah 18 tahun.</li>
      </ul>
      <p className="mt-3">
        Kami tidak meminta nomor telepon, tanggal lahir, sekolah, atau alamat.
        Tidak ada iklan atau pelacak pihak ketiga.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-zinc-50">Pemroses data</h2>
      <p className="mt-3">Data kamu disimpan dan diproses di luar Indonesia oleh:</p>
      <ul className="mt-3 space-y-3">
        {processors.map(([name, use, region]) => (
          <li key={name} className="rounded-lg border border-zinc-800/80 p-4">
            <p className="font-medium text-zinc-50">{name}</p>
            <p className="text-sm">{use}</p>
            <p className="text-sm text-zinc-500">Lokasi: {region}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-zinc-50">Ekspor dan hapus akun</h2>
      <p className="mt-3">
        Di halaman profil kamu bisa mengunduh semua data belajar kamu sebagai
        JSON, atau menghapus akun. Menghapus akun menghapus semua data belajar
        kamu dan tidak bisa dibatalkan.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-zinc-50">Jika terjadi kebocoran</h2>
      <p className="mt-3">
        Jika data pelajar bocor, kami memberi tahu pengguna yang terdampak dan
        otoritas pelindungan data dalam 3x24 jam, lewat email dan pengumuman
        di halaman ini, beserta data apa yang terdampak dan langkah yang perlu
        kamu ambil.
      </p>
    </main>
  );
}
