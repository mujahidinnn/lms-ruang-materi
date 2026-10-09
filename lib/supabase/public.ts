import { createClient } from "@supabase/supabase-js";

// Cookie-less anon client. Only lib/content.ts may use it, so cached reads
// never depend on who is signed in.
export const publicClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
