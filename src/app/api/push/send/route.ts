// src/app/api/push/send/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerReadClient } from "@/lib/supabase/server-read";
import { sendPushToUser } from "@/lib/push/send";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerReadClient();

    // Auth
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Tenant
    const { data: tenantId, error: tenantErr } = await supabase.rpc(
      "current_tenant_id"
    );
    if (tenantErr || !tenantId) {
      return NextResponse.json(
        { error: "No tenant bound to profile" },
        { status: 400 }
      );
    }

    // Body
    const rawBody: unknown = await req.json();
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const body = rawBody as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title : "";
    const message = typeof body.body === "string" ? body.body : "";
    const url = typeof body.url === "string" ? body.url : "/app";

    if (!title || !message) {
      return NextResponse.json(
        { error: "Missing title/body" },
        { status: 400 }
      );
    }

    const result = await sendPushToUser(supabase, tenantId, userData.user.id, {
      title,
      body: message,
      url,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, results: result.results });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
