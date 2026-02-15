// src/app/api/push/test/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerReadClient } from "@/lib/supabase/server-read";
import { sendPushToUser } from "@/lib/push/send";

export const runtime = "nodejs";

export async function POST() {
  // DEV-only Absicherung
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const supabase = await createSupabaseServerReadClient();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: tenantId, error: tenantErr } = await supabase.rpc(
      "current_tenant_id"
    );
    if (tenantErr || !tenantId) {
      return NextResponse.json(
        { error: "No tenant bound to profile" },
        { status: 400 }
      );
    }

    const result = await sendPushToUser(supabase, tenantId, userData.user.id, {
      title: "DITIB Cockpit",
      body: "Test Push empfangen ✅",
      url: "/app",
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
