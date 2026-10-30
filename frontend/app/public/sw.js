// SPDX-License-Identifier: AGPL-3.0-or-later
// Quenda service worker: shows Web Push notices and opens the app when one is tapped.
// The payload is generic on purpose (no names, places or times); the details are in the app.
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
