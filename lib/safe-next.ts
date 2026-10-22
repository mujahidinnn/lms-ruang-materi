// Only same-site relative paths, so ?next= cannot send users off-site.
export function safeNext(next: unknown, fallback = "/"): string {
  if (typeof next !== "string" || !next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  // Browsers drop tabs and newlines from URLs, so "/\t/evil.com" lands on //evil.com.
  if (/[\x00-\x1f\x7f]/.test(next)) return fallback;
  return next;
}
