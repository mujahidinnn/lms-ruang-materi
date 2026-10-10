import { ListChecks } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import BelajarViewer from "@/components/belajar/BelajarViewer";
import { primaryButton } from "@/components/ui/styles";
import { getTopic, getTopics } from "@/lib/content";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

export async function generateStaticParams() {
  const topics = await getTopics();
  if (topics.length === 0) {
    throw new Error(
      "No published topics. The build needs NEXT_PUBLIC_SUPABASE_* and at least one published topic (run scripts/migrate-decks.mjs)."
    );
  }
  return topics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata(
  props: PageProps<"/belajar/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const presentation = await getTopic(slug);

  if (!presentation) {
    return {};
  }

  const { title, description } = presentation;
  const url = `${SITE_URL}/belajar/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      title: `${title} · ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${SITE_NAME}`,
      description,
      images: [SITE_OG_IMAGE.url],
    },
  };
}

export default async function PresentationPage(
  props: PageProps<"/belajar/[slug]">
) {
  const { slug } = await props.params;
  const presentation = await getTopic(slug);

  if (!presentation) {
    notFound();
  }

  return (
    <main>
      <BelajarViewer presentation={presentation} />
      {(presentation.summary || presentation.tips.length > 0 || presentation.practiceCount > 0) && (
        <section aria-label="Ringkasan dan tips" className="border-t border-zinc-800/80 px-6 py-14 sm:px-10">
          <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[3fr_2fr]">
            {presentation.summary && (
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Ringkasan</h2>
                <div className="mt-4 space-y-4 leading-relaxed text-zinc-300">
                  {presentation.summary.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>
            )}
            {presentation.tips.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Tips</h2>
                <ul className="mt-4 space-y-3">
                  {presentation.tips.map((tip, i) => (
                    <li key={i} className="border-l-2 border-accent/50 pl-4 text-sm leading-relaxed text-zinc-300">{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {(presentation.practiceCount > 0 || presentation.cardCount > 0) && (
            <div className="mx-auto mt-12 flex max-w-5xl flex-wrap items-center justify-end gap-4">
              {presentation.cardCount > 0 && (
                <Link href={`/flashcard/${slug}`} className="min-h-11 content-center text-zinc-400 hover:text-zinc-50">
                  Flashcard {presentation.cardCount} kartu
                </Link>
              )}
              {presentation.practiceCount > 0 && (
                <Link href={`/latihan/${slug}`} className={primaryButton}><ListChecks aria-hidden className="size-4" />Mulai latihan</Link>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
