import { parseCookieHeader } from "@supabase/ssr";
import { defineMiddleware } from "astro:middleware";
import { requestStore } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";

const STATIC = /\.(?:avif|png|jpg|svg|ico|webp|js|css|woff2?|html)$/;

// Opens the request store and refreshes the Supabase session cookie before
// the page renders. Not an auth gate: lib/dal.ts and src/lib/guard.ts are.
export const onRequest = defineMiddleware((context, next) => {
  const jar = new Map(parseCookieHeader(context.request.headers.get("cookie") ?? "").map(({ name, value }) => [name, value ?? ""]));
  return requestStore.run({ cookies: context.cookies, request: context.request, jar, memo: new Map() }, async () => {
    if (!context.isPrerendered && !STATIC.test(context.url.pathname)) {
      await (await createClient()).auth.getClaims();
    }
    return next();
  });
});
