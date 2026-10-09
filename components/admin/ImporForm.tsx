"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { mulaiImpor } from "@/app/admin/impor/actions";
import { MAX_PPTX_BYTES, MAX_SLIDES, countSlides, estimateTokens, isZip } from "@/lib/pptx";
import { createClient } from "@/lib/supabase/client";

const field =
  "min-h-11 rounded-md border border-zinc-800/80 bg-zinc-900 px-3 text-zinc-50 outline-none focus-visible:ring-2 focus-visible:ring-accent";

type Picked = { file: File; slides: number };

export default function ImporForm({ models }: { models: string[] }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [slug, setSlug] = useState("");
  const [model, setModel] = useState(models[0] ?? "");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  async function pick(file: File | undefined) {
    setPicked(null);
    setMessage("");
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!file.name.toLowerCase().endsWith(".pptx") || !isZip(bytes)) return setMessage("Pilih file .pptx.");
    if (file.size > MAX_PPTX_BYTES) return setMessage("File lebih dari 50 MB.");
    const slides = countSlides(bytes);
    if (slides < 1 || slides > MAX_SLIDES) return setMessage(`Deck berisi ${slides} slide. Maksimal ${MAX_SLIDES}, pecah dulu.`);
    setPicked({ file, slides });
    if (!slug) {
      setSlug(file.name.replace(/\.pptx$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  }

  function submit() {
    if (!picked) return;
    start(async () => {
      setMessage("Mengunggah...");
      const filePath = `${crypto.randomUUID()}.pptx`;
      const { error } = await createClient()
        .storage.from("imports")
        .upload(filePath, picked.file, {
          contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        });
      if (error) return setMessage("Upload gagal. Coba lagi.");
      const res = await mulaiImpor({ filePath, originalName: picked.file.name, slug, model });
      if (res.error) return setMessage(res.error);
      setPicked(null);
      setSlug("");
      setMessage("Impor dimulai.");
      router.refresh();
    });
  }

  const est = picked && estimateTokens(picked.slides);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-800/80 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          File .pptx
          <input type="file" accept=".pptx" onChange={(e) => pick(e.target.files?.[0])} className="text-sm text-zinc-300 file:mr-3 file:min-h-11 file:rounded-md file:border file:border-zinc-800/80 file:bg-zinc-900 file:px-3 file:text-zinc-50" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          Slug
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          Model
          <select value={model} onChange={(e) => setModel(e.target.value)} className={field}>
            {models.map((m) => (
              <option key={m} value={m}>
                {m.replace(":", " · ")}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-zinc-400">
          {est && `${picked.slides} slide, perkiraan ${est.input.toLocaleString("id-ID")} token masuk dan ${est.output.toLocaleString("id-ID")} token keluar. `}
          {message}
        </p>
        <button
          onClick={submit}
          disabled={!picked || !slug || !model || pending}
          className="min-h-11 rounded-md bg-accent px-4 font-medium text-zinc-950 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
        >
          Mulai impor
        </button>
      </div>
    </div>
  );
}
