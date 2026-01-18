// Change VERSION on each release to force updates
const VERSION = "v12";
const CACHE_NAME = `gicu-guidelines-${VERSION}`;

const APP_SHELL = [
  "/",
  "/index.html",
  "/app.js",
  "/manifest.json",
];

// Install: cache the app shell and activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

// Activate: delete old caches and take control
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  try {
    const fresh = await fetch(request, { cache: "no-store" });
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw e;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  const isShell =
    url.pathname === "/" ||
    url.pathname === "/index.html" ||
    url.pathname === "/app.js" ||
    url.pathname === "/manifest.json";

  // Ensure updates propagate: always prefer network for core files
  if (isShell) {
    event.respondWith(networkFirst(req));
    return;
  }

  /
