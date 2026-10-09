"use client";

import { FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { mulaiImpor } from "@/app/admin/impor/actions";
import { MAX_PPTX_BYTES, MAX_SLIDES, countSlides, estimateTokens, isZip } from "@/lib/pptx";
import { createClient } from "@/lib/supabase/client";
import { field, primaryButton } from "./editor";

type Picked = { file: File; slides: number };

const toSlug = (name: string) =>
  name.replace(/\.pptx$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function ImporForm({ models }: { models: string[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [slug, setSlug] = useState("");
  const [model, setModel] = useState(models[0] ?? "");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, start] = useTransition();

  async function pick(file: File | undefined) {
    setPicked(null);
    setMessage(null);
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!file.name.toLowerCase().endsWith(".pptx") || !isZip(bytes)) return setMessage({ text: "File harus berformat .pptx.", error: true });
    if (file.size > MAX_PPTX_BYTES) return setMessage({ text: "Ukuran file lebih dari 50 MB.", error: true });
    const slides = countSlides(bytes);
    if (slides < 1 || slides > MAX_SLIDES) {
      return setMessage({ text: `Deck berisi ${slides} slide, batasnya ${MAX_SLIDES}. Pecah deck dulu.`, error: true });
    }
    setPicked({ file, slides });
    setSlug(toSlug(file.name));
  }

  function submit() {
    if (!picked) return;
    start(async () => {
      setMessage({ text: "Mengunggah deck..." });
      const filePath = `${crypto.randomUUID()}.pptx`;
      const { error } = await createClient()
        .storage.from("imports")
        .upload(filePath, picked.file, { contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
      if (error) return setMessage({ text: "Upload gagal. Periksa koneksi lalu coba lagi.", error: true });
      const res = await mulaiImpor({ filePath, originalName: picked.file.name, slug, model });
      if (res.error) return setMessage({ text: res.error, error: true });
      setPicked(null);
      setMessage({ text: "Impor dimulai. Statusnya muncul di riwayat di bawah." });
      router.refresh();
    });
  }

  const est = picked && estimateTokens(picked.slides);

  return (
    <section aria-label="Unggah deck" className="flex flex-col gap-4">
      <label
        onDragOver={(e) => (e.preventDefault(), setDragging(true))}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => (e.preventDefault(), setDragging(false), pick(e.dataTransfer.files[0]))}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center transition-colors focus-within:outline-2 focus-within:outline-accent ${
          dragging ? "border-accent bg-accent/5" : "border-zinc-700 hover:border-zinc-500"
        }`}
      >
        <FileUp aria-hidden className="size-8 text-accent" strokeWidth={1.5} />
        {picked ? (
          <span>
            <span className="block font-medium">{picked.file.name}</span>
            <span className="text-sm text-zinc-400">
              {picked.slides} slide, sekitar {est!.input.toLocaleString("id-ID")} token masuk. Klik untuk ganti file.
            </span>
          </span>
        ) : (
          <span>
            <span className="block font-medium">Tarik file .pptx ke sini, atau klik untuk memilih</span>
            <span className="text-sm text-zinc-400">Maksimal 50 MB dan {MAX_SLIDES} slide.</span>
          </span>
        )}
        <input type="file" accept=".pptx" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      </label>

      {picked && (
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="flex flex-col gap-1.5 text-sm text-zinc-300">
            Slug topik
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={`${field} font-mono`} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-zinc-300">
            Model
            <select value={model} onChange={(e) => setModel(e.target.value)} className={field}>
              {models.map((m) => <option key={m} value={m}>{m.replace(":", " / ")}</option>)}
            </select>
          </label>
          <button onClick={submit} disabled={!slug || pending} className={primaryButton}>
            {pending ? "Memproses..." : "Mulai impor"}
          </button>
        </div>
      )}

      <p aria-live="polite" className={`min-h-5 text-sm ${message?.error ? "text-red-500" : "text-zinc-400"}`}>
        {message?.text}
      </p>
    </section>
  );
}
