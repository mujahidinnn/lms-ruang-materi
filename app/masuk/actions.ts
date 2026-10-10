"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNext } from "@/lib/safe-next";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export type MasukState = { status: "idle" | "sent" | "error"; message?: string };

const schema = z.object({
  email: z.email(),
  password: z.string().max(200).optional(),
  next: z.string().optional(),
});

export async function masuk(
  _prev: MasukState,
  formData: FormData
): Promise<MasukState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: "Alamat email belum benar." };
  }

  const next = safeNext(parsed.data.next);
  const supabase = await createClient();

  // With a password, sign in directly. Without one, send a magic link.
  if (parsed.data.password) {
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) {
      return { status: "error", message: "Email atau kata sandi salah." };
    }
    redirect(next);
  }

  // Only this site or a local dev server may receive the link; a spoofed
  // Origin falls back to SITE_URL even if the Supabase allowlist is loose.
  const sent = (await headers()).get("origin") ?? "";
  const origin = sent === SITE_URL || /^http:\/\/localhost:\d+$/.test(sent) ? sent : SITE_URL;
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/masuk/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { status: "error", message: "Tautan gagal dikirim. Coba lagi sebentar lagi." };
  }
  return { status: "sent" };
}

export async function keluar() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
