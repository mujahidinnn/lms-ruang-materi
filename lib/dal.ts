import { notFound, perRequest, redirect } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";

export type Role = "student" | "admin";
export type CurrentUser = { id: string; email: string; role: Role };

// Returns null when signed out. getClaims() verifies the JWT signature
// (locally with the project's signing keys, else against the Auth server),
// never trusting the cookie as getSession() would. is_admin() reads the role
// from the same JWT, so both run at once instead of one after the other.
export function getCurrentUser(): Promise<CurrentUser | null> {
  return perRequest("user", async () => {
    const supabase = await createClient();
    const [{ data }, { data: admin }] = await Promise.all([supabase.auth.getClaims(), supabase.rpc("is_admin")]);
    const claims = data?.claims;
    if (!claims?.sub) return null;

    return {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : "",
      role: admin === true ? "admin" : "student",
    };
  });
}

export function signInPath(next: string): string {
  return `/masuk?next=${encodeURIComponent(next)}`;
}

// For actions: these throw, and the action endpoint answers with a redirect
// or 404. Pages use the guards in src/lib/guard.ts instead, which return.
export async function requireUser(next = "/"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(signInPath(next));
  return user;
}

// Students get a 404 so admin routes do not advertise themselves.
export async function requireAdmin(next = "/admin"): Promise<CurrentUser> {
  const user = await requireUser(next);
  if (user.role !== "admin") notFound();
  return user;
}
