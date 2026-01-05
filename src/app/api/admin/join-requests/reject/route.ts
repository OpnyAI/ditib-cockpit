// src/app/api/admin/join-requests/reject/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerMutableClient } from "@/lib/supabase/server-mutable";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // 1) Auth via Cookie/JWT
  const supabaseAuth = await createSupabaseServerMutableClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  // 2) FormData lesen
  const form = await req.formData();
  const id = String(form.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // 3) Service Role Client
  const srv = createSupabaseServiceRoleClient();

  // 4) Request laden
  const { data: r, error: rErr } = await srv
    .from("tenant_join_requests")
    .select("id,tenant_id,status")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      tenant_id: string | null;
      status: string;
    }>();

  if (rErr || !r?.id) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (!r.tenant_id) {
    return NextResponse.json(
      { error: "Request has no tenant_id" },
      { status: 400 }
    );
  }

  if (r.status !== "PENDING") {
    return NextResponse.redirect(new URL("/app/admin/requests", req.url));
  }

  // 5) Admin-Profil prüfen
  const { data: adminProfile } = await srv
    .from("profiles")
    .select("user_id, tenant_id, role")
    .eq("user_id", user.id)
    .maybeSingle<{
      user_id: string;
      tenant_id: string | null;
      role: string;
    }>();

  if (
    !adminProfile ||
    adminProfile.role !== "ADMIN" ||
    adminProfile.tenant_id !== r.tenant_id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 6) Reject
  const { error: upReqErr } = await srv
    .from("tenant_join_requests")
    .update({ status: "REJECTED", decided_at: new Date().toISOString() })
    .eq("id", r.id);

  if (upReqErr) {
    return NextResponse.json(
      { error: `Reject failed: ${upReqErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.redirect(new URL("/app/admin/requests", req.url));
}
