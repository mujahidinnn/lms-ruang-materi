"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { enabledModels } from "@/lib/llm";
import { MAX_PPTX_BYTES, MAX_SLIDES, countSlides, isZip } from "@/lib/pptx";
import { createClient } from "@/lib/supabase/server";

export type ImporState = { error?: string; ok?: boolean };

const input = z.object({
  filePath: z.string().regex(/^(migrasi\/[a-z0-9-]+|[0-9a-f-]{36})\.pptx$/),
  originalName: z.string().max(200).regex(/\.pptx$/i),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka dan tanda hubung").max(60),
  model: z.string().regex(/^[a-z]+:[a-z0-9./:-]+$/),
});

export async function mulaiImpor(raw: z.input<typeof input>): Promise<ImporState> {
  await requireAdmin("/admin/impor");
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { filePath, originalName, slug } = parsed.data;
  if (!enabledModels().includes(parsed.data.model)) return { error: "Model tidak tersedia." };
  // Split at the first colon: OpenRouter model IDs contain one too.
  const i = parsed.data.model.indexOf(":");
  const provider = parsed.data.model.slice(0, i);
  const model = parsed.data.model.slice(i + 1);

  // Re-check what the browser uploaded: size, zip magic bytes, slide count.
  const supabase = await createClient();
  const { data: file, error: dlError } = await supabase.storage.from("imports").download(filePath);
  if (dlError || !file) return { error: "File tidak ditemukan di Storage." };
  if (file.size > MAX_PPTX_BYTES) return { error: "File lebih dari 50 MB." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isZip(bytes)) return { error: "File bukan .pptx yang valid." };
  const slideCount = countSlides(bytes);
  if (slideCount < 1 || slideCount > MAX_SLIDES) {
    return { error: `Deck berisi ${slideCount} slide. Maksimal ${MAX_SLIDES}, pecah dulu.` };
  }

  const id = randomUUID();
  const { error } = await supabase.from("import_jobs").insert({
    id,
    file_path: filePath,
    original_name: originalName,
    slug,
    provider,
    model,
    slide_count: slideCount,
  });
  if (error) return { error: error.code === "P0001" ? error.message : "Gagal membuat job impor." };

  const res = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_REPO}/actions/workflows/import-deck.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_DISPATCH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main", inputs: { job_id: id } }),
    }
  );
  if (!res.ok) {
    await supabase.from("import_jobs").delete().eq("id", id);
    return { error: `Gagal memicu GitHub Actions (${res.status}).` };
  }

  revalidatePath("/admin/impor");
  return { ok: true };
}
