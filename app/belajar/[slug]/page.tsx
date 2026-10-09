import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PresentationViewer from "@/components/PresentationViewer";
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
      <PresentationViewer presentation={presentation} />
    </main>
  );
}
