import { LayoutTemplate, Route } from "lucide-react";
import CurrentYear from "@/components/CurrentYear";
import { LogoMark } from "@/components/brand/Logo";
import HeroRoom from "@/components/landing/HeroRoom";
import SignedInRedirect from "@/components/landing/SignedInRedirect";
import SiteHeader from "@/components/landing/SiteHeader";
import TopicCard from "@/components/landing/TopicCard";
import TrackCard from "@/components/landing/TrackCard";
import { card, chip, primaryButton, secondaryButton } from "@/components/ui/styles";
import { getTopics, getTracks } from "@/lib/content";
import Link from "next/link";

export default async function Home() {
  const [topics, tracks] = await Promise.all([getTopics(), getTracks()]);
  const totalSlides = topics.reduce((sum, t) => sum + t.slideCount, 0);

  return (
    <div className="relative">
      <SiteHeader />
      <SignedInRedirect />

      <main className="px-5 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <section className="grid grid-cols-1 items-center gap-12 py-10 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div>
              <h1 className="max-w-xl text-[2.6rem] leading-[1.04] font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                Ruang untuk belajar, satu slide setiap langkah
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400">
                Materi pemrograman dari deck presentasi, bisa kamu buka dan
                telusuri langsung di browser. Tanpa unduh, tanpa daftar.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#roadmap" className={primaryButton}>
                  <Route aria-hidden className="size-4" />
                  Pilih roadmap
                </a>
                <a href="#materi" className={`${secondaryButton} min-h-12`}>
                  Lihat semua materi
                </a>
              </div>
              <ul aria-label="Isi Ruang Materi" className="mt-10 flex flex-wrap gap-2">
                <li className={`${chip} bg-tile-lavender tabular-nums`}>{tracks.length} roadmap</li>
                <li className={`${chip} bg-tile-mint tabular-nums`}>{topics.length} materi</li>
                <li className={`${chip} bg-tile-butter tabular-nums`}>{totalSlides} slide</li>
                <li className={`${chip} bg-tile-pink`}>gratis</li>
              </ul>
            </div>
            {/* Only the cover slide crosses to the client, not every slide of every deck. */}
            <HeroRoom topics={topics.slice(0, 5).map((t) => ({ ...t, slides: t.slides.slice(0, 1) }))} />
          </section>

          <section id="roadmap" aria-labelledby="roadmap-judul" className="scroll-mt-6 py-12 sm:py-16">
            <h2 id="roadmap-judul" className="text-3xl font-bold tracking-tight sm:text-4xl">Belajar lewat roadmap</h2>
            <p className="mt-2 max-w-xl text-zinc-400">Urutan topik yang disarankan, dari dasar sampai mahir. Lulus ujian tiap topik untuk naik level.</p>
            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((t) => <TrackCard key={t.slug} track={t} />)}
            </ul>
          </section>

          <section id="materi" aria-labelledby="materi-judul" className="scroll-mt-6 py-12 sm:py-16">
            <h2 id="materi-judul" className="text-3xl font-bold tracking-tight sm:text-4xl">Semua materi</h2>
            <p className="mt-2 max-w-xl text-zinc-400">Mulai dari mana saja. Setiap materi berdiri sendiri.</p>
            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((t, i) => <TopicCard key={t.slug} topic={t} index={i} />)}
            </ul>
          </section>

          <section aria-labelledby="template-judul" className={`my-12 flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8 ${card}`}>
            <div>
              <h2 id="template-judul" className="text-xl font-bold tracking-tight">Template HTML</h2>
              <p className="mt-1 text-sm text-zinc-400">Template portfolio gratis untuk kamu pakai dan ubah sendiri.</p>
            </div>
            <Link href="/template" className={secondaryButton}>
              <LayoutTemplate aria-hidden className="size-4" />
              Lihat template
            </Link>
          </section>
        </div>
      </main>

      <footer className="px-5 py-8 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 text-sm text-zinc-500">
          <span className="flex items-center gap-2">
            <LogoMark className="size-5" />
            &copy; <CurrentYear /> Ruang Materi
          </span>
          <Link href="/template" className="hover:text-zinc-300">Template</Link>
          <Link href="/privasi" className="hover:text-zinc-300">Privasi</Link>
          <a
            href="https://mujahidin.my.id"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="mujahidin.my.id"
            className="ml-auto font-(family-name:--font-signature) text-2xl text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Mujahidin
          </a>
        </div>
      </footer>
    </div>
  );
}
