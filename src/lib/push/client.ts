// src/lib/push/client.ts

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i)
    outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function getVapidPublicKey(): Promise<string | null> {
  const res = await fetch("/api/push/config", { method: "GET" });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.vapidPublicKey ?? null;
}

export async function ensureWebPushSubscribed() {
  if (typeof window === "undefined") return { ok: false, reason: "server" };
  if (!("serviceWorker" in navigator)) return { ok: false, reason: "no_sw" };
  if (!("PushManager" in window)) return { ok: false, reason: "no_push" };
  if (Notification.permission === "denied")
    return { ok: false, reason: "denied" };

  const vapidPublicKey = await getVapidPublicKey();
  if (!vapidPublicKey) return { ok: false, reason: "missing_vapid_public" };

  // Permission nur bei Bedarf anfragen
  if (Notification.permission !== "granted") {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return { ok: false, reason: "not_granted" };
  }

  // SW registrieren
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;

  // Subscription holen/erstellen
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  // An API senden
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: sub.toJSON(),
      userAgent: navigator.userAgent,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    return { ok: false, reason: "api_error", details: txt };
  }

  return { ok: true };
}
