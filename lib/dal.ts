import { currentRequest, notFound, Pending, perRequest, redirect } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";

export type Role = "student" | "admin";

// A hint for cached public pages (the "Admin" item in the account menu,
// shown through the admin: variant). Never trusted: /admin checks the role.
export const ADMIN_HINT = "rm-admin";
// Records "last seen" for the admin Pengguna list, at most every 3 minutes
// per browser (a cookie), and every 2 minutes per user (touch_seen()).
const SEEN = "rm-seen";
async function touchSeen(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { cookies } = currentRequest();
  if (cookies.get(SEEN)) return;
  cookies.set(SEEN, "1", { path: "/", maxAge: 180, httpOnly: true, sameSite: "lax", secure: import.meta.env.PROD });
  await supabase.rpc("touch_seen");
}

function hintAdmin(on: boolean) {
  const { cookies } = currentRequest();
  const has = cookies.get(ADMIN_HINT)?.value === "1";
  if (on && !has) cookies.set(ADMIN_HINT, "1", { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax", secure: import.meta.env.PROD });
  else if (!on && has) cookies.delete(ADMIN_HINT, { path: "/" });
}
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
    if (!claims?.sub) {
      hintAdmin(false);
      return null;
    }
    hintAdmin(admin === true);
    await touchSeen(supabase);

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

// The one account whose admin changes run at once; everyone else's wait in
// /admin/persetujuan. Same email as public.is_approver().
export const APPROVER = "mujahidin28394@gmail.com";
// Admin actions that change nothing (or only mail the admin themself).
const READ_ONLY = new Set(["slugTersedia", "daftarPengguna", "kirimTesPengumuman"]);

// Students get a 404 so admin routes do not advertise themselves. Another
// admin's change through /rpc is stored for the approver and not run.
export async function requireAdmin(next = "/admin"): Promise<CurrentUser> {
  const user = await requireUser(next);
  if (user.role !== "admin") notFound();
  const call = currentRequest().rpc;
  if (call && user.email !== APPROVER && !READ_ONLY.has(call.name)) {
    const { error } = await (await createClient())
      .from("admin_approvals")
      .insert({ action: call.name, args: call.args, requested_by: user.id, requested_email: user.email });
    if (error) throw new Error(error.message);
    throw new Pending();
  }
  return user;
}
