import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "student" | "admin";
export type CurrentUser = { id: string; email: string; role: Role };

// Returns null when signed out. getUser() verifies with the Auth server.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    role: profile?.role === "admin" ? "admin" : "student",
  };
});

export async function requireUser(next = "/"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/masuk?next=${encodeURIComponent(next)}`);
  return user;
}

// Students get a 404 so admin routes do not advertise themselves.
export async function requireAdmin(next = "/admin"): Promise<CurrentUser> {
  const user = await requireUser(next);
  if (user.role !== "admin") notFound();
  return user;
}
