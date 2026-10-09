// Applies supabase/migrations to the project in .env.local through the
// session pooler (the direct host is IPv6 only). Extra args pass through,
// e.g. `npm run db:push -- --dry-run`.
import { spawnSync } from "node:child_process";

const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
// Dashboard > Connect > Session pooler, e.g. aws-1-ap-southeast-1.pooler.supabase.com
const host = process.env.SUPABASE_POOLER_HOST;
if (!host) throw new Error("Set SUPABASE_POOLER_HOST in .env.local (Dashboard > Connect > Session pooler).");
const url = `postgresql://postgres.${ref}:${encodeURIComponent(process.env.SUPABASE_DB_PW)}@${host}:5432/postgres`;
// spawnSync instead of execFileSync so a failure never prints the URL with the password.
const { status } = spawnSync("npx", ["supabase", "db", "push", "--db-url", url, ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(status ?? 1);
