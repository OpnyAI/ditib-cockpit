import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Body = {
  targetUserId: string;
  tenantId: string;
  role: "MITARBEITER" | "VORSTAND" | "KASSIERER" | "ADMIN";
};

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

    const body = (await req.json()) as Partial<Body>;
    const targetUserId = body.targetUserId?.trim();
    const tenantId = body.tenantId?.trim();
    const role = body.role;

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
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
