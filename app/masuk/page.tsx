import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import MasukForm from "@/components/auth/MasukForm";
import Logo from "@/components/brand/Logo";
import Room from "@/components/illustrations/Room";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke Ruang Materi dengan tautan dari email untuk menyimpan progres belajar kamu.",
  robots: { index: false },
};

export default function MasukPage(props: PageProps<"/masuk">) {
  return (
    <main className="relative flex flex-1 flex-col justify-center px-5 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Link href="/" aria-label="Ruang Materi, beranda" className="w-fit">
          <Logo />
        </Link>
        <div className="rounded-[32px] bg-tile-lavender p-6 sm:p-8">
          <Room className="size-20">
            <rect x="24" y="40" width="36" height="27" rx="5" className="fill-zinc-50" />
          </Room>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">Masuk</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Pakai kata sandi, atau kosongkan dan kami kirim tautan masuk ke email kamu.
          </p>
        </div>
        <div className="rounded-[32px] bg-zinc-900 p-6 shadow-soft sm:p-8">
          <Suspense>
            <Form searchParams={props.searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/masuk">["searchParams"] }) {
  const params = await searchParams;
  return <MasukForm next={safeNext(params.next)} galat={params.galat === "1"} />;
}
