/*
 * Service worker for The Straight Path.
 * - Navigations: network-first, cache fallback, then /offline.
 * - Static assets (/_next/static, images, fonts): cache-first.
 * - Never touches /admin or /api (the CMS must always be live).
 */
const VERSION = "v6";
const CACHE_PREFIX = "straight-path-";
const SHELL_CACHE = `${CACHE_PREFIX}${VERSION}-shell`;
const PAGE_CACHE = `${CACHE_PREFIX}${VERSION}-pages`;
const ASSET_CACHE = `${CACHE_PREFIX}${VERSION}-assets`;
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];
const MAX_PAGE_ENTRIES = 40;
const MAX_ASSET_ENTRIES = 120;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith(CACHE_PREFIX) &&
                key !== SHELL_CACHE &&
                key !== PAGE_CACHE &&
                key !== ASSET_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    /\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname)
  );
}

function responseMayBeStored(response) {
  const cacheControl = response.headers.get("cache-control") ?? "";
  return response.ok && !/(?:^|,)\s*(?:private|no-store)\b/i.test(cacheControl);
}

async function putWithLimit(cacheName, request, response, maximumEntries) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  const keys = await cache.keys();
  const overflow = keys.length - maximumEntries;
  if (overflow > 0) {
    await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  // The CMS admin and API must never be served from cache.
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then((response) => {
          // Do not retain search terms or tracking parameters in offline
          // storage. Cache only clean, publicly cacheable page URLs.
          if (url.search === "" && responseMayBeStored(response)) {
            event.waitUntil(
              putWithLimit(PAGE_CACHE, request, response.clone(), MAX_PAGE_ENTRIES).catch(
                () => {},
              ),
            );
          }
          return response;
        })
        .catch(async () => {
          const pageCache = await caches.open(PAGE_CACHE);
          const shellCache = await caches.open(SHELL_CACHE);
          const cached = await pageCache.match(request);
          return cached ?? (await shellCache.match(OFFLINE_URL));
        }),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (responseMayBeStored(response)) {
              event.waitUntil(
                putWithLimit(
                  ASSET_CACHE,
                  request,
                  response.clone(),
                  MAX_ASSET_ENTRIES,
                ).catch(() => {}),
              );
            }
            return response;
          }),
      ),
    );
  }
});
