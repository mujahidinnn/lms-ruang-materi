import { LayoutTemplate, Route } from "lucide-react";
import CurrentYear from "@/components/CurrentYear";
import { LogoMark } from "@/components/brand/Logo";
import HeroRoom from "@/components/landing/HeroRoom";
import SignedInRedirect from "@/components/landing/SignedInRedirect";
import SiteHeader from "@/components/landing/SiteHeader";
import TopicCard from "@/components/landing/TopicCard";
import TrackCard from "@/components/landing/TrackCard";
import { getTopics, getTracks } from "@/lib/content";
import Link from "next/link";

export default async function Home() {
  const [topics, tracks] = await Promise.all([getTopics(), getTracks()]);
  const totalSlides = topics.reduce((sum, t) => sum + t.slideCount, 0);

  return (
    <div className="relative">
      <SiteHeader />
      <SignedInRedirect />

      <main className="px-6 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <section className="grid grid-cols-1 items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div>
              <h1 className="max-w-xl text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Ruang untuk belajar, satu slide setiap langkah
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400">
                Materi pemrograman dari deck presentasi, bisa kamu buka dan
                telusuri langsung di browser. Tanpa unduh, tanpa daftar.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#roadmap"
                  className="flex min-h-12 items-center gap-2 rounded-lg bg-accent px-5 font-medium text-zinc-950 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <Route aria-hidden className="size-4" />
                  Pilih roadmap
                </a>
                <a
                  href="#materi"
                  className="flex min-h-12 items-center rounded-lg px-4 text-zinc-300 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  Lihat semua materi
                </a>
              </div>
              <p className="mt-10 text-sm text-zinc-500">
                {tracks.length} roadmap, {topics.length} materi, {totalSlides} slide, semuanya gratis.
              </p>
            </div>
            <HeroRoom topics={topics.slice(0, 5)} />
          </section>

          <section id="roadmap" aria-labelledby="roadmap-judul" className="scroll-mt-6 border-t border-zinc-800/80 py-16 sm:py-20">
            <h2 id="roadmap-judul" className="text-2xl font-semibold tracking-tight sm:text-3xl">Belajar lewat roadmap</h2>
            <p className="mt-2 max-w-xl text-zinc-400">Urutan topik yang disarankan, dari dasar sampai mahir. Lulus ujian tiap topik untuk naik level.</p>
            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((t) => <TrackCard key={t.slug} track={t} />)}
            </ul>
          </section>

          <section id="materi" aria-labelledby="materi-judul" className="scroll-mt-6 border-t border-zinc-800/80 py-16 sm:py-20">
            <h2 id="materi-judul" className="text-2xl font-semibold tracking-tight sm:text-3xl">Semua materi</h2>
            <p className="mt-2 max-w-xl text-zinc-400">Mulai dari mana saja. Setiap materi berdiri sendiri.</p>
            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((t) => <TopicCard key={t.slug} topic={t} />)}
            </ul>
          </section>

          <section aria-labelledby="template-judul" className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800/80 py-12">
            <div>
              <h2 id="template-judul" className="text-lg font-semibold">Template HTML</h2>
              <p className="mt-1 text-sm text-zinc-400">Template portfolio gratis untuk kamu pakai dan ubah sendiri.</p>
            </div>
            <Link href="/template" className="flex min-h-11 items-center gap-2 rounded-lg border border-zinc-800 px-4 text-sm hover:border-zinc-600">
              <LayoutTemplate aria-hidden className="size-4" />
              Lihat template
            </Link>
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-800/80 px-6 py-8 sm:px-10">
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
