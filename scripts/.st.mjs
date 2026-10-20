import { createClient } from "@supabase/supabase-js";
const e = process.env;
const db = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const { error: le } = await db.auth.signInWithPassword({ email: e.DEV_ADMIN_EMAIL, password: e.DEV_ADMIN_PASSWORD });
if (le) throw new Error("login " + le.message);
const { data, error } = await db.from("import_jobs").select("slug,status,error,created_at").gte("created_at", new Date(Date.now() - 864e5).toISOString()).order("created_at");
if (error) throw error;
for (const j of data) console.log(new Date(j.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }), j.slug, j.status, (j.error ?? "").slice(0, 120));
console.log("used", data.length, "of 10");
