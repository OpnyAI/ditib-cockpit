// src/app/api/push/send/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerReadClient } from "@/lib/supabase/server-read";
import { sendPushToUser } from "@/lib/push/send";

export const runtime = "nodejs";

type Body = {
  title: string;
  body: string;
  url?: string;
};

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
    const body = (await req.json()) as Body;
    if (!body?.title || !body?.body) {
      return NextResponse.json(
        { error: "Missing title/body" },
        { status: 400 }
      );
    }

    const result = await sendPushToUser(
      supabase as any,
      tenantId,
      userData.user.id,
      {
        title: body.title,
        body: body.body,
        url: body.url || "/app",
      }
    );

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, results: result.results });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
