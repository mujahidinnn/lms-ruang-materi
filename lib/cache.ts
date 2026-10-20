// Published content, kept in memory for a minute per server instance (this
// replaces Next's 'use cache' + cacheTag). Publishing clears this instance;
// others catch up within TTL_MS, and the CDN within its s-maxage (see
// src/lib/cdn.ts).
// ponytail: per-instance memory, a shared store (Vercel Runtime Cache, Redis) if staleness after publish matters.
const TTL_MS = 60_000;
const store = new Map<string, { at: number; value: Promise<unknown> }>();

export function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as Promise<T>;
  const value = fn();
  store.set(key, { at: Date.now(), value });
  // A failed read is not kept.
  value.catch(() => store.delete(key));
  return value;
}

export function invalidateContent() {
  store.clear();
}
