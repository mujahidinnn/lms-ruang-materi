import type { Metadata } from "next";
import { Suspense } from "react";
import MasukForm from "@/components/auth/MasukForm";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke Ruang Materi dengan tautan dari email untuk menyimpan progres belajar kamu.",
  robots: { index: false },
};

export default function MasukPage(props: PageProps<"/masuk">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Masuk</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Pakai kata sandi, atau kosongkan dan kami kirim tautan masuk ke email kamu.
        </p>
      </div>
      <Suspense>
        <Form searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/masuk">["searchParams"] }) {
  const params = await searchParams;
  return <MasukForm next={safeNext(params.next)} galat={params.galat === "1"} />;
}
