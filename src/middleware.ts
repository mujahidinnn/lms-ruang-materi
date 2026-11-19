import { parseCookieHeader } from "@supabase/ssr";
import { defineMiddleware } from "astro:middleware";
import { getCurrentUser, signInPath } from "@/lib/dal";
import { requestStore } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";

const STATIC = /\.(?:avif|png|jpg|svg|ico|webp|js|css|woff2?|html)$/;

// Opens the request store and refreshes the Supabase session cookie before
// the page renders. /admin gets a backstop check here, so a new admin page
// that forgets adminOnly stays closed; the real guards are lib/dal.ts and
// src/lib/guard.ts.
export const onRequest = defineMiddleware((context, next) => {
  const jar = new Map(parseCookieHeader(context.request.headers.get("cookie") ?? "").map(({ name, value }) => [name, value ?? ""]));
  return requestStore.run({ cookies: context.cookies, request: context.request, jar, memo: new Map() }, async () => {
    if (!context.isPrerendered && !STATIC.test(context.url.pathname)) {
      await (await createClient()).auth.getClaims();
    }
    if (/^\/admin(?:\/|$)/.test(context.url.pathname)) {
      const user = await getCurrentUser();
      if (!user) return context.redirect(signInPath(context.url.pathname + context.url.search));
      if (user.role !== "admin") return context.rewrite("/404");
    }
    return next();
  });
});
