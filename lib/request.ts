import { AsyncLocalStorage } from "node:async_hooks";
import type { AstroCookies } from "astro";

// The request being served, so server code (Supabase client, dal, actions)
// reaches its cookies without threading Astro's context through every call.
// src/middleware.ts opens it for each request.
// jar: the request's cookies plus any set while serving it, so a refreshed
// session is what later reads in the same request see.
export type RequestStore = { cookies: AstroCookies; request: Request; jar: Map<string, string>; memo: Map<string, Promise<unknown>>; refresh?: boolean };

export const requestStore = new AsyncLocalStorage<RequestStore>();

export function currentRequest(): RequestStore {
  const store = requestStore.getStore();
  if (!store) throw new Error("No request in scope; is src/middleware.ts running?");
  return store;
}

// Once per request, like React's cache() was in Next.
export function perRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const { memo } = currentRequest();
  if (!memo.has(key)) memo.set(key, fn());
  return memo.get(key) as Promise<T>;
}

// Thrown by server code to leave the request; the action endpoint turns them
// into responses, pages check guards themselves (see lib/dal.ts).
export class Redirect extends Error {
  constructor(readonly to: string) {
    super(`redirect ${to}`);
  }
}
export class NotFound extends Error {}

export function redirect(to: string): never {
  throw new Redirect(to);
}
export function notFound(): never {
  throw new NotFound("not found");
}

// Asks the browser to reload after the action, so server-rendered data on
// the page is fresh (Next's revalidatePath + router refresh).
export function refresh() {
  currentRequest().refresh = true;
}
