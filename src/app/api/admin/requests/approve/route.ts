import { NextResponse } from "next/server";
import { createSupabaseServerMutableClient } from "@/lib/supabase/server-mutable";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";
import { writeActivityLog } from "@/lib/activity/log";
import { sendPushToUser } from "@/lib/push/send";

export async function POST(req: Request) {
  const supabaseAuth = await createSupabaseServerMutableClient();

  // vorher: getSession() -> jetzt: getUser() (sicherer + keine Warning-Spam)
  const {
    data: { user },
    error: userErr,
  } = await supabaseAuth.auth.getUser();
  const adminUserId = user?.id;

  if (userErr || !adminUserId) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const rawBody: unknown = await req.json();
  if (!rawBody || typeof rawBody !== "object") {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }
  const body = rawBody as Record<string, unknown>;

  const request_id =
    typeof body.request_id === "string" ? body.request_id.trim() : "";
  const role =
    typeof body.role === "string" ? body.role.trim() : "KOMMUNIKATION";
  const is_board_member =
    typeof body.is_board_member === "boolean"
      ? body.is_board_member
      : Boolean(body.is_board_member ?? true);

  if (!request_id)
    return NextResponse.json({ error: "MISSING_REQUEST_ID" }, { status: 400 });

  const srv = createSupabaseServiceRoleClient();

  const { data: reqRow } = await srv
    .from("tenant_join_requests")
    .select("id, tenant_id, user_id, status")
    .eq("id", request_id)
    .maybeSingle<{
      id: string;
      tenant_id: string;
      user_id: string;
      status: string;
    }>();

  if (!reqRow?.id || !reqRow.tenant_id)
    return NextResponse.json({ error: "REQUEST_NOT_FOUND" }, { status: 404 });
  if (reqRow.status !== "PENDING")
    return NextResponse.json({ error: "NOT_PENDING" }, { status: 409 });

  // Authorization: Admin muss ADMIN des Tenants sein
  const { data: adminProfile } = await srv
    .from("profiles")
    .select("user_id, tenant_id, role, display_name")
    .eq("user_id", adminUserId)
    .maybeSingle<{
      user_id: string;
      tenant_id: string;
      role: string;
      display_name: string | null;
    }>();

  if (
    !adminProfile ||
    adminProfile.tenant_id !== reqRow.tenant_id ||
    adminProfile.role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Profil freischalten
  const { error: profErr } = await srv
    .from("profiles")
    .update({ tenant_id: reqRow.tenant_id, role, is_board_member })
    .eq("user_id", reqRow.user_id);

  if (profErr)
    return NextResponse.json(
      { error: "PROFILE_APPROVE_FAILED", detail: profErr.message },
      { status: 500 }
    );

  // Request updaten
  const { error: updErr } = await srv
    .from("tenant_join_requests")
    .update({ status: "APPROVED", decided_at: new Date().toISOString() })
    .eq("id", reqRow.id);

  if (updErr)
    return NextResponse.json(
      { error: "REQUEST_UPDATE_FAILED", detail: updErr.message },
      { status: 500 }
    );

  // Activity Log (ADMIN_ONLY)
  await writeActivityLog({
    tenant_id: reqRow.tenant_id,
    actor_user_id: adminUserId,
    actor_name: adminProfile.display_name ?? null,
    action: "JOIN_REQUEST_APPROVED",
    entity_type: "JOIN_REQUEST",
    entity_id: reqRow.id,
    visibility: "ADMIN_ONLY",
    meta: { approved_user_id: reqRow.user_id, role, is_board_member },
  });

  // Push an Antragsteller (best effort)
  try {
    await sendPushToUser(srv, reqRow.tenant_id, reqRow.user_id, {
      title: "DITIB Cockpit",
      body: "Dein Beitritt wurde genehmigt ✅",
      url: "/app",
    });
  } catch (e: unknown) {
    console.error(
      "Push send (admin/requests/approve) failed:",
      e instanceof Error ? e.message : String(e)
    );
  }

  return NextResponse.json({ ok: true });
}
