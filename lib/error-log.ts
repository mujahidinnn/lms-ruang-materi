import { announcementHtml, sendEmails } from "@/lib/announce-mail";
import { APPROVER } from "@/lib/dal";
import { publicClient } from "@/lib/supabase/public";

export type ErrorSource = "server" | "rpc" | "client";

// Records an error in error_log (supabase/migrations/*_error_log.sql) and,
// at most once an hour for a new error, emails the approver. Never throws:
// logging must not turn one failure into two.
export async function logError(source: ErrorSource, path: string, err: unknown, stack?: string) {
  try {
    const e = err instanceof Error ? err : null;
    const message = (e ? `${e.name}: ${e.message}` : String(err)).slice(0, 500);
    const { data: alert } = await publicClient.rpc("log_error", { p_source: source, p_path: path, p_message: message, p_stack: (stack ?? e?.stack ?? "").slice(0, 4000) });
    if (alert === true) {
      await sendEmails([APPROVER], `Error baru: ${message.slice(0, 80)}`, announcementHtml({
        title: "Ada error baru di Ruang Materi",
        body: `${source} di ${path || "/"}\n\n${message}`,
        link: "/admin/error",
        chip: "Error",
        footnote: "Email ini dikirim paling banyak sekali per jam. Error berikutnya tetap tercatat di Admin > Error.",
      }));
    }
  } catch {}
}
