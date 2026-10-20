import type { AstroGlobal } from "astro";
import { getCurrentUser, signInPath, type CurrentUser } from "@/lib/dal";

// Page guards. A page writes
//   const user = await signedIn(Astro); if (user instanceof Response) return user;
// so a guest is sent to /masuk and a student on an admin page gets the 404.
export async function signedIn(Astro: AstroGlobal): Promise<CurrentUser | Response> {
  const user = await getCurrentUser();
  return user ?? Astro.redirect(signInPath(Astro.url.pathname + Astro.url.search));
}

export async function adminOnly(Astro: AstroGlobal): Promise<CurrentUser | Response> {
  const user = await signedIn(Astro);
  if (user instanceof Response || user.role === "admin") return user;
  return Astro.rewrite("/404");
}
