import CurrentYear from "@/components/CurrentYear";
import PageBackdrop from "@/components/PageBackdrop";
import TemplateGallery from "@/components/TemplateGallery";
import { LogoMark } from "@/components/brand/Logo";
import HeroRoom from "@/components/landing/HeroRoom";
import SiteHeader from "@/components/landing/SiteHeader";
import TopicCard from "@/components/landing/TopicCard";
import { templates } from "@/data/templates";
import { getTopics } from "@/lib/content";
import Link from "next/link";

export default async function Home() {
  const topics = await getTopics();
  const totalSlides = topics.reduce((sum, t) => sum + t.slideCount, 0);

  return (
    <div className="relative">
      <PageBackdrop />
      <SiteHeader />

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
                  href="#materi"
                  className="flex min-h-12 items-center rounded-lg bg-accent px-5 font-medium text-zinc-950 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Pilih materi
                </a>
                <a
                  href="#template"
                  className="flex min-h-12 items-center rounded-lg px-4 text-zinc-300 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  Lihat template HTML
                </a>
              </div>
              <p className="mt-10 text-sm text-zinc-500">
                {topics.length} materi, {totalSlides} slide, semuanya gratis.
              </p>
            </div>
            <HeroRoom topics={topics.slice(0, 5)} />
          </section>

          <section id="materi" aria-labelledby="materi-judul" className="scroll-mt-6 border-t border-zinc-800/80 py-16 sm:py-20">
            <h2 id="materi-judul" className="text-2xl font-semibold tracking-tight sm:text-3xl">Semua materi</h2>
            <p className="mt-2 max-w-xl text-zinc-400">Mulai dari mana saja. Setiap materi berdiri sendiri.</p>
            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((t) => <TopicCard key={t.slug} topic={t} />)}
            </ul>
          </section>

          <section id="template" aria-labelledby="template-judul" className="scroll-mt-6 border-t border-zinc-800/80 py-16 sm:py-20">
            <div className="mb-10 max-w-xl">
              <h2 id="template-judul" className="text-2xl font-semibold tracking-tight sm:text-3xl">Template HTML</h2>
              <p className="mt-2 text-zinc-400">Lihat preview langsung, lalu unduh kodenya untuk kamu pakai dan ubah sendiri.</p>
            </div>
            <TemplateGallery templates={templates} />
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-800/80 px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 text-sm text-zinc-500">
          <span className="flex items-center gap-2">
            <LogoMark className="size-5" />
            &copy; <CurrentYear /> Ruang Materi
          </span>
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
