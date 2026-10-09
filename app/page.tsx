import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import CurrentYear from "@/components/CurrentYear";
import AnimatedHeroTitle from "@/components/AnimatedHeroTitle";
import HeroIllustration from "@/components/HeroIllustration";
import PageBackdrop from "@/components/PageBackdrop";
import TemplateGallery from "@/components/TemplateGallery";
import { templates } from "@/data/templates";
import { getTopics } from "@/lib/content";
import { coverSrc } from "@/lib/slides";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default async function Home() {
  const presentations = await getTopics();
  const totalSlides = presentations.reduce((sum, p) => sum + p.slideCount, 0);

  return (
    <div className="relative">
      <PageBackdrop />

      <main className="px-6 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <section className="grid grid-cols-1 items-center gap-10 border-b border-zinc-800/80 py-16 sm:py-24 lg:grid-cols-[1fr_auto] lg:gap-16">
            <div>
              <p className="text-xs font-medium tracking-widest text-zinc-500 uppercase">
                {presentations.length} materi · {totalSlides} slide
              </p>
              <AnimatedHeroTitle />
              <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                {SITE_DESCRIPTION}
              </p>
            </div>
            <div className="hidden justify-self-center lg:block lg:justify-self-end">
              <HeroIllustration />
            </div>
          </section>

          <section
            aria-label="Daftar materi belajar"
            className="py-16 sm:py-24"
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
              {presentations.map((presentation) => (
                <article
                  key={presentation.slug}
                  className="overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950 transition-colors hover:border-zinc-700"
                >
                  <Link
                    href={`/belajar/${presentation.slug}`}
                    className="group flex h-full flex-col"
                  >
                    <div className="relative aspect-video overflow-hidden border-b border-zinc-800/80">
                      <Image
                        src={coverSrc(presentation)}
                        alt={`Sampul materi ${presentation.title}`}
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <h2 className="text-xl font-semibold tracking-tight text-zinc-50">
                          {presentation.title}
                        </h2>
                        <ArrowUpRight
                          className="mt-1 h-5 w-5 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-50"
                          strokeWidth={1.75}
                        />
                      </div>
                      <p className="flex-1 text-sm leading-relaxed text-zinc-400">
                        {presentation.description}
                      </p>
                      <span className="font-mono text-xs tracking-wide text-zinc-500">
                        {String(presentation.slideCount).padStart(2, "0")} SLIDE
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section
            id="template"
            aria-labelledby="template-heading"
            className="border-t border-zinc-800/80 py-16 sm:py-24"
          >
            <div className="mb-10 max-w-xl">
              <h2
                id="template-heading"
                className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl"
              >
                Template HTML
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Lihat preview langsung, lalu unduh kodenya untuk kamu pakai dan
                ubah sendiri.
              </p>
            </div>
            <TemplateGallery templates={templates} />
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-800/80 px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; <CurrentYear /> {SITE_NAME}. Seluruh hak cipta
            dilindungi.
          </span>
          <a
            href="https://mujahidin.my.id"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="mujahidin.my.id"
            className="font-(family-name:--font-signature) text-2xl text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Mujahidin
          </a>
        </div>
      </footer>
    </div>
  );
}
