// SPDX-License-Identifier: AGPL-3.0-or-later
// Quenda backoffice service worker: keeps the app shell so door mode opens without
// a network (#24). A copy of frontend/app/public/sw.js without Web Push.
const PREFIX = "quenda-admin-";
const scope = new URL(self.registration.scope);
// Door data is kept by the page itself; the API answers are per session and
// no-store, so they never go into this cache.
function handled(url) {
  return (
    url.origin === scope.origin &&
    url.pathname.startsWith(scope.pathname) &&
    !url.pathname.startsWith("/v2/") &&
    !url.pathname.startsWith("/api/")
  );
}
// The build writes here the files to keep and their version (frontend/vite-precache.mts),
// so every deploy changes this file and browsers install the new worker.
const PRECACHE = { version: "dev", files: [] };
const CACHE = PREFIX + PRECACHE.version;
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(
          PRECACHE.files.map(
            (file) => new Request(new URL(file, scope), { cache: "reload" }),
          ),
        ),
      ),
  );
});
// The new version takes over once every window of the old one is closed, so a
// page that is open keeps the files it started with.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith(PREFIX) && name !== CACHE)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!handled(url)) return;
  if (request.mode === "navigate") {
    // Network first so a deploy shows at once; the stored shell when there is none.
    event.respondWith(
      fetch(request).catch(async () => {
        const shell = await caches.match(new URL("index.html", scope));
        return shell ?? Response.error();
      }),
    );
    return;
  }
  // Built files carry a hash in their name, so a stored copy is always right.
  event.respondWith(
    caches.match(request).then((stored) => stored ?? fetch(request)),
  );
});
