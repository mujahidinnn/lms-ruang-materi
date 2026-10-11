import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BelajarViewer from "@/components/belajar/BelajarViewer";
import { getTopic, getTopics } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export async function generateStaticParams() {
  return (await getTopics()).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(props: PageProps<"/belajar/[slug]/slide">): Promise<Metadata> {
  const { slug } = await props.params;
  const topic = await getTopic(slug);
  if (!topic) return {};
  return { title: `Slide ${topic.title}`, description: topic.description, alternates: { canonical: `${SITE_URL}/belajar/${slug}/slide` } };
}

export default async function SlidePage(props: PageProps<"/belajar/[slug]/slide">) {
  const { slug } = await props.params;
  const topic = await getTopic(slug);
  if (!topic) notFound();
  return <main><BelajarViewer presentation={topic} /></main>;
}
