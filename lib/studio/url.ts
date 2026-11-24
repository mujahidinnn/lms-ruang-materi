// The live address a learner submits. https only, a real host, no login in the
// address, short. Returns the cleaned address or null.
export function cleanStudioUrl(raw: string): string | null {
  const s = raw.trim();
  if (s.length > 300 || /\s/.test(s) || !/^https:\/\//i.test(s)) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" || u.username || u.password) return null;
    const host = u.hostname.toLowerCase();
    if (!host.includes(".") || host === "localhost" || host.endsWith(".local") || /^[\d.]+$/.test(host) || host.includes(":")) return null;
    return u.toString();
  } catch {
    return null;
  }
}
