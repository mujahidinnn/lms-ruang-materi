import { createClient } from "@supabase/supabase-js";

// Cookie-less anon client. Only lib/content.ts may read with it, so cached
// reads never depend on who is signed in; lib/error-log.ts writes with it
// because errors can happen outside a request.
export const publicClient = createClient(
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL!,
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
