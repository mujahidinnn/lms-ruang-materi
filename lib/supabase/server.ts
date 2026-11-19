import { createServerClient } from "@supabase/ssr";
import { currentRequest } from "@/lib/request";

export async function createClient() {
  const { cookies, jar, request } = currentRequest();
  // GoTrue stores the caller's User-Agent on the session; forward the browser's
  // so the profile's device list shows it instead of this server's.
  const ua = request.headers.get("user-agent");

  return createServerClient(
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL!,
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: ua ? { headers: { "User-Agent": ua } } : undefined,
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            if (value) jar.set(name, value);
            else jar.delete(name);
            try {
              cookies.set(name, value, options);
            } catch {
              // The response has started streaming; src/middleware.ts already
              // refreshed the session before render, so this is safe to skip.
            }
          }
        },
      },
    }
  );
}
