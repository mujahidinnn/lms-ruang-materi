import type { Metadata } from "next";
import TemplateGallery from "@/components/TemplateGallery";
import SiteHeader from "@/components/landing/SiteHeader";
import { templates } from "@/data/templates";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Template HTML",
  description: "Template portfolio HTML, CSS dan JavaScript gratis. Lihat preview langsung, lalu unduh atau salin kodenya.",
  alternates: { canonical: `${SITE_URL}/template` },
};

export default function TemplatePage() {
  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 px-5 pb-20 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Template HTML</h1>
            <p className="mt-2 text-zinc-400">Lihat preview langsung, lalu unduh kodenya untuk kamu pakai dan ubah sendiri.</p>
          </div>
          <TemplateGallery templates={templates} />
        </div>
      </main>
    </div>
  );
}
