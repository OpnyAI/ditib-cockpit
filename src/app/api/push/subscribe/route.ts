// src/app/api/push/subscribe/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerReadClient } from "@/lib/supabase/server-read";

export const runtime = "nodejs";

type Body = {
  subscription: {
    endpoint: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
  userAgent?: string;
};

export async function POST(req: Request) {
  const supabase = await createSupabaseServerReadClient();

  // Auth prüfen (WICHTIG: getUser() statt getSession())
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await req.json()) as Body;
  const endpoint = body?.subscription?.endpoint;
  const p256dh = body?.subscription?.keys?.p256dh ?? null;
  const auth = body?.subscription?.keys?.auth ?? null;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "Invalid subscription payload" },
      { status: 400 }
    );
  }

  // Tenant aus Profile holen
  const { data: tenantId, error: tenantErr } = await supabase.rpc(
    "current_tenant_id"
  );
  if (tenantErr || !tenantId) {
    return NextResponse.json(
      { error: "No tenant bound to profile" },
      { status: 400 }
    );
  }

  // Upsert in push_subscriptions
  const { error: upsertErr } = await supabase.from("push_subscriptions").upsert(
    {
      tenant_id: tenantId,
      user_id: userData.user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: body.userAgent ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,user_id,endpoint" }
  );

  if (upsertErr) {
    return NextResponse.json(
      { error: "DB upsert failed", details: upsertErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
