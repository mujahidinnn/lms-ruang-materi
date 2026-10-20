import { createServerClient } from "@supabase/ssr";
import { currentRequest } from "@/lib/request";

export async function createClient() {
  const { cookies, jar } = currentRequest();

  return createServerClient(
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL!,
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
