"use client";

import Select from "@/components/ui/Select";
import { FileUp } from "lucide-react";
import { useState, useTransition } from "react";
import { MAX_PPTX_BYTES, MAX_SLIDES, countSlides, estimateTokens, isZip } from "@/lib/pptx";
import { createClient } from "@/lib/supabase/client";
import { field, primaryButton } from "./editor";
import { rpc } from "@/lib/rpc";

const mulaiImpor = rpc("mulaiImpor");

type Picked = { file: File; slides: number };

const toSlug = (name: string) =>
  name.replace(/\.pptx$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function ImporForm({ models }: { models: string[] }) {
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
      location.reload();
    });
  }

  const est = picked && estimateTokens(picked.slides);

  return (
    <section aria-label="Unggah deck" className="flex h-full flex-col gap-4">
      <label
        onDragOver={(e) => (e.preventDefault(), setDragging(true))}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => (e.preventDefault(), setDragging(false), pick(e.dataTransfer.files[0]))}
        className={`flex min-h-40 flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed px-6 py-6 sm:min-h-64 sm:gap-3 sm:py-12 text-center shadow-soft transition-colors focus-within:outline-2 focus-within:outline-accent ${
          dragging ? "border-zinc-50 bg-tile-mint" : "border-zinc-700 bg-zinc-900 hover:border-brand hover:bg-tile-sky"
        }`}
      >
        <span className="grid size-16 place-items-center rounded-[18px] bg-primary text-on-primary">
          <FileUp aria-hidden className="size-7" strokeWidth={1.75} />
        </span>
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
        <div className="grid gap-4 rounded-[18px] bg-zinc-900 p-5 shadow-soft sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="flex flex-col gap-1.5 text-sm text-zinc-300">
            Slug topik
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={`${field} font-mono`} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-zinc-300">
            Model
            <Select label="Model" value={model} options={models.map((m) => [m, m.replace(":", " / ")] as const)} onChange={setModel} className="mt-1" />
          </label>
          <button onClick={submit} disabled={!slug || pending} className={primaryButton}>
            {!pending && <FileUp aria-hidden className="size-4" />}
            {pending ? "Memproses..." : "Mulai impor"}
          </button>
        </div>
      )}

      {/* Takes no room until there is a message, so the upload card stays as tall as the status column. */}
      <p aria-live="polite" className={message ? `text-sm ${message.error ? "text-red-500" : "text-zinc-400"}` : "sr-only"}>
        {message?.text}
      </p>
    </section>
  );
}
