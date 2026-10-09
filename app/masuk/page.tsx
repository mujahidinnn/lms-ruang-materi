import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import MasukForm from "@/components/auth/MasukForm";
import Logo from "@/components/brand/Logo";
import PageBackdrop from "@/components/PageBackdrop";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke Ruang Materi dengan tautan dari email untuk menyimpan progres belajar kamu.",
  robots: { index: false },
};

export default function MasukPage(props: PageProps<"/masuk">) {
  return (
    <main className="relative flex flex-1 flex-col justify-center px-4 py-16">
      <PageBackdrop />
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <Link href="/" aria-label="Ruang Materi, beranda" className="w-fit">
          <Logo />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Masuk</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Pakai kata sandi, atau kosongkan dan kami kirim tautan masuk ke email kamu.
          </p>
        </div>
        <Suspense>
          <Form searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/masuk">["searchParams"] }) {
  const params = await searchParams;
  return <MasukForm next={safeNext(params.next)} galat={params.galat === "1"} />;
}
