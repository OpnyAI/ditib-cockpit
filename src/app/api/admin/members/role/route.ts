import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // 1) Auth: wer ruft?
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (userErr || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const rawBody: unknown = await req.json();
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const body = rawBody as Record<string, unknown>;

    const targetUserId =
      typeof body.targetUserId === "string" ? body.targetUserId.trim() : "";
    const tenantId =
      typeof body.tenantId === "string" ? body.tenantId.trim() : "";
    const role =
      body.role === "MITARBEITER" ||
      body.role === "VORSTAND" ||
      body.role === "KASSIERER" ||
      body.role === "ADMIN"
        ? body.role
        : null;

    if (!targetUserId || !tenantId || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 2) Authorization: ist der Caller Admin dieses Tenants?
    const { data: isAdmin, error: adminErr } = await supabase.rpc(
      "is_admin_of_tenant",
      { tid: tenantId }
    );

    if (adminErr) {
      return NextResponse.json(
        { error: `Authorization check failed: ${adminErr.message}` },
        { status: 403 }
      );
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Optional: verhindert, dass Admins über UI weitere ADMINs machen
    // (wenn du das willst: Default: Admin-Rolle nur via "Admin-Setup-Link")
    if (role === "ADMIN") {
      return NextResponse.json(
        { error: "Assigning ADMIN is not allowed via UI." },
        { status: 400 }
      );
    }

    // 3) Update mit Service Role (bypasst RLS), Trigger lässt es zu (auth.uid() == null)
    const service = getServiceSupabase();
    const { error: updErr } = await service
      .from("profiles")
      .update({ role })
      .eq("user_id", targetUserId)
      .eq("tenant_id", tenantId);

    if (updErr) {
      return NextResponse.json(
        { error: `Update profile failed: ${updErr.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
