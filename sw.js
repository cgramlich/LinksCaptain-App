/* LinksCaptain service worker - OFFLINE PHASE 1 (app shell only).
   ===========================================================================
   Mirrors the MenuCaptain PWA shell, trimmed to this app: one self-contained
   index.html, Google-Fonts webfonts, our own icons - no CDN libs, no map, and
   crucially NO caching of the sync/AI network calls.

   Goal: the app reliably OPENS with a poor or missing connection, and is a
   real installable PWA. User data already lives in localStorage, so reads work
   offline regardless; this just guarantees the shell loads.

   The one rule that matters most: never trap the user on a stale build.
   - The app document (index.html) is NETWORK-FIRST: online you always get the
     freshest file, so the in-app version checker keeps working untouched; the
     cached copy is served only when the network truly fails.
   - Cache names are tied to VERSION, and `activate` deletes every cache that
     does not match, so each deploy cleanly rolls the cache.
   - VERSION is bumped together with APP_VERSION in index.html, which changes
     this file's bytes and makes the browser install the new worker.

   Scope by request type:
   - app document              -> network-first, fall back to cached shell
   - version check (?_= / ?u=)  -> NOT intercepted (query'd, non-navigation)
   - api.github.com (sync)      -> NEVER intercepted (default network)
   - api.anthropic.com (AI)     -> NEVER intercepted (POST; and default network)
   - immutable assets (Google Fonts, our own images/icons) -> cache-first
   - everything else            -> default network
*/

const VERSION     = "1.18.2";                     // keep in lockstep with APP_VERSION
const SHELL_CACHE = "golf-shell-" + VERSION;
const ASSET_CACHE = "golf-assets-" + VERSION;

// Served from the root of linkscaptain.com (or a GitHub Pages project subpath).
// Derive the scope from this worker's own location so both work unchanged.
const SCOPE     = new URL("./", self.location).pathname;   // "/" on the domain, or a project subpath
const SHELL_URL = SCOPE;                                    // canonical app-doc key

// Primed on install so even the very first offline open renders in-brand.
const CRITICAL_ASSETS = [
  SCOPE + "icon-192.png",
  SCOPE + "icon-512.png",
  SCOPE + "apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    // allSettled so a single missing asset can't fail the whole install.
    const assets = await caches.open(ASSET_CACHE);
    await Promise.allSettled(CRITICAL_ASSETS.map((u) => assets.add(u)));
    // Prime the app shell from the network (best-effort).
    try {
      const shell = await caches.open(SHELL_CACHE);
      const r = await fetch(SHELL_URL, { cache: "no-store" });
      if (r && r.ok) await shell.put(SHELL_URL, r.clone());
    } catch (e) { /* offline at install time - fine, fill on first online load */ }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// Lets the app force a full cache wipe (e.g. when applying an update).
self.addEventListener("message", (event) => {
  const data = event.data;
  if (data === "clearCache" || (data && data.type === "clearCache")) {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    })());
  }
});

function isImmutableAsset(url) {
  if (url.hostname === "fonts.googleapis.com") return true;            // font css
  if (url.hostname === "fonts.gstatic.com") return true;               // font files
  if (url.origin === self.location.origin &&
      /\.(png|jpe?g|webp|gif|svg|ico|woff2?)$/i.test(url.pathname)) return true;  // our images/icons
  return false;
}

async function shellNetworkFirst(req) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.ok) cache.put(SHELL_URL, fresh.clone());        // store under canonical key (no ?query pollution)
    return fresh;
  } catch (e) {
    const cached = await cache.match(SHELL_URL);
    return cached || Response.error();
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const fresh = await fetch(req);
    if (fresh && (fresh.ok || fresh.type === "opaque")) cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    return cached || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;                                    // never touch writes (AI POST, sync PUT)
  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // Leave the sync/AI backends entirely alone - always the real network.
  if (url.hostname === "api.github.com" || url.hostname === "api.anthropic.com") return;

  const isAppDoc = url.origin === self.location.origin &&
                   (url.pathname === SHELL_URL || url.pathname === SHELL_URL + "index.html");

  // The app document: network-first. A navigation always counts; a plain
  // (query-less) GET of the doc counts too. The version check (?_=) and the
  // update navigation (?u=) are excluded from the query'd-fetch branch so the
  // in-app updater keeps hitting the network.
  if (isAppDoc && (req.mode === "navigate" || !url.search)) {
    event.respondWith(shellNetworkFirst(req));
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(req, ASSET_CACHE));
    return;
  }
  // Everything else -> default network.
});
