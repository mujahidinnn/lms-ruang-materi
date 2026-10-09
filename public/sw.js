// Hand-written service worker. Caches an allowlist only; everything else
// goes straight to the network. Bump VERSION on every change to this file.
const VERSION = "rm-2";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const OFFLINE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.add(OFFLINE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(`${VERSION}-`)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Sent on sign-out, so a shared phone keeps no pages from the last learner.
self.addEventListener("message", (event) => {
  if (event.data === "clear-pages") event.waitUntil(caches.delete(PAGES).then(() => caches.open(PAGES)).then((c) => c.add(OFFLINE)));
});

// ponytail: the static cache grows with every slide viewed; add an LRU trim
// if storage warnings show up on phones.
async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") (await caches.open(STATIC)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(PAGES)).put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) ?? (await caches.match(OFFLINE));
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.searchParams.has("_rsc") || request.headers.has("RSC")) return;

  if (url.origin !== self.location.origin) {
    // Slide images in Supabase Storage. Nothing else from Supabase.
    if (url.pathname.includes("/storage/v1/object/public/slides/")) event.respondWith(cacheFirst(request));
    return;
  }

  const path = url.pathname;
  if (path.startsWith("/_next/static/") || path.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
  } else if (request.mode === "navigate") {
    if (path === "/" || path.startsWith("/belajar/") || path.startsWith("/roadmap")) {
      event.respondWith(networkFirst(request));
    } else {
      event.respondWith(fetch(request).catch(() => caches.match(OFFLINE)));
    }
  }
});
