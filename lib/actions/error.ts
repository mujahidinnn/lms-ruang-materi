import { z } from "zod";
import { requireAdmin } from "@/lib/dal";
import { logError } from "@/lib/error-log";
import { refresh } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";

const report = z.object({
  path: z.string().max(300).regex(/^\//),
  message: z.string().min(1).max(500),
  stack: z.string().max(4000).default(""),
});

// Uncaught browser errors, sent by src/layouts/Base.astro. Anyone may call
// it; log_error() caps what it stores.
export async function laporError(input: unknown) {
  const r = report.safeParse(input);
  if (r.success) await logError("client", r.data.path, r.data.message, r.data.stack);
}

export async function selesaikanError(_: unknown, form: FormData): Promise<{ error?: string; ok?: string }> {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(form.get("id"));
  if (!id.success) return { error: "Error tidak valid." };
  const { error } = await (await createClient()).from("error_log").update({ resolved_at: new Date().toISOString() }).eq("id", id.data);
  if (error) return { error: "Gagal menyimpan." };
  refresh();
  return { ok: "Ditandai beres." };
}
