// public/sw.js (oder wo dein SW liegt – wichtig ist: das ist der registrierte SW)

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "DITIB Cockpit", body: event.data?.text() || "Test Push" };
  }

  const title = data.title || "DITIB Cockpit";
  const options = {
    body: data.body || "Test Push empfangen ✅",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/badge-96.png",
    data: data.data || {},
    tag: data.tag || "ditib-test",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) || "/app";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existing = allClients.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })()
  );
});
