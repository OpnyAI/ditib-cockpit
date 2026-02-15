// src/lib/push/send.ts
import webpush, { type PushSubscription } from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
};

function ensureVapidConfigured() {
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID keys on server");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendPushToUser(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  payload: PushPayload
) {
  ensureVapidConfigured();

  const { data: subs, error: subsErr } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);

  if (subsErr) {
    return { ok: false as const, error: subsErr.message };
  }

  if (!subs || subs.length === 0) {
    return { ok: false as const, error: "No subscriptions found" };
  }

  const webpushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/app",
    icon: payload.icon,
    badge: payload.badge,
  });

  const results: Array<{
    id: string;
    ok: boolean;
    statusCode?: number | null;
    message?: string;
  }> = [];

  for (const s of subs) {
    const subscription = {
      endpoint: s.endpoint,
      keys: { p256dh: s.p256dh, auth: s.auth },
    };

    try {
      await webpush.sendNotification(
        subscription as unknown as PushSubscription,
        webpushPayload
      );

      await supabase
        .from("push_subscriptions")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", s.id);

      results.push({ id: s.id, ok: true });
    } catch (err: unknown) {
      const errObj =
        typeof err === "object" && err !== null
          ? (err as Record<string, unknown>)
          : {};
      const statusCode =
        typeof errObj.statusCode === "number"
          ? errObj.statusCode
          : typeof errObj.status === "number"
          ? errObj.status
          : null;

      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", s.id);
      }

      results.push({
        id: s.id,
        ok: false,
        statusCode,
        message:
          typeof errObj.body === "string"
            ? errObj.body
            : typeof errObj.message === "string"
            ? errObj.message
            : "send failed",
      });
    }
  }

  return { ok: true as const, results };
}
