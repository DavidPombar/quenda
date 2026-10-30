// SPDX-License-Identifier: AGPL-3.0-or-later
// Quenda service worker: keeps the app shell for offline use (#24), shows Web Push
// notices and opens the app when one is tapped (#35).
// The admin has its own copy without push (frontend/admin/public/sw.js).
const PREFIX = "quenda-app-";
const scope = new URL(self.registration.scope);
// Bookings, passes and the rest of the data are kept by the app itself; the API
// answers are per person and no-store, so they never go into this cache.
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
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let notice;
  try {
    notice = event.data.json();
  } catch {
    return;
  }
  event.waitUntil(
    self.registration.showNotification(notice.title, {
      body: notice.body,
      tag: notice.tag,
      icon: "icon-192.png",
      badge: "icon-192.png",
      data: { url: notice.url },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url ?? "./",
    self.registration.scope,
  );
  // Only pages of this app: a payload cannot send the person anywhere else.
  if (target.origin !== self.location.origin) return;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const open = windows.find((client) =>
          client.url.startsWith(self.registration.scope),
        );
        if (open)
          return open.navigate(target.href).then((client) => client?.focus());
        return self.clients.openWindow(target.href);
      }),
  );
});
