// public/sw.js  — place this file in your frontend's /public folder

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// ── Push event: fires even when the browser tab is closed ─────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "New Message", body: event.data.text() };
  }

  const { title = "ORHC Portal", body = "You have a new message", url = "/superadmin/messages" } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/JOB_LOGO.jpg",       // adjust to your actual icon path
      badge: "/JOB_LOGO.jpg",     // small monochrome icon shown in status bar
      tag: "orhc-message",     // replaces previous notification instead of stacking
      renotify: true,          // still vibrate/sound even if tag matches
      data: { url },
    })
  );
});

// ── Notification click: focus existing tab or open new one ────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/superadmin/messages";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If a tab with the portal is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Otherwise open a new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});