import { NextResponse } from "next/server";
import { createSupabaseServerMutableClient } from "@/lib/supabase/server-mutable";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerMutableClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json(
      { ok: false, data: null, error: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, data: null, error: "INVALID_JSON" },
      { status: 400 },
    );
  }

  if (!isRecord(rawBody)) {
    return NextResponse.json(
      { ok: false, data: null, error: "INVALID_PAYLOAD" },
      { status: 400 },
    );
  }

  const inviteCodeRaw = typeof rawBody.invite_code === "string" ? rawBody.invite_code : "";
  const inviteCode = normalizeInviteCode(inviteCodeRaw);

  if (inviteCode.length < 6) {
    return NextResponse.json(
      { ok: false, data: null, error: "INVITE_CODE_INVALID" },
      { status: 400 },
    );
  }

  const service = createSupabaseServiceRoleClient();

  const { data: profile, error: profileErr } = await service
    .from("profiles")
    .select("tenant_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle<{ tenant_id: string | null; display_name: string | null }>();

  if (profileErr || !profile) {
    return NextResponse.json(
      { ok: false, data: null, error: "PROFILE_NOT_FOUND" },
      { status: 403 },
    );
  }

  if (profile.tenant_id) {
    return NextResponse.json(
      { ok: false, data: null, error: "ALREADY_IN_TENANT" },
      { status: 409 },
    );
  }

  const { data: tenant, error: tenantErr } = await service
    .from("tenants")
    .select("id, invite_code, invite_enabled")
    .ilike("invite_code", inviteCode)
    .eq("invite_enabled", true)
    .maybeSingle<{ id: string; invite_code: string; invite_enabled: boolean }>();

  if (tenantErr || !tenant) {
    return NextResponse.json(
      { ok: false, data: null, error: "INVITE_CODE_INVALID" },
      { status: 404 },
    );
  }

  const { data: existingPending, error: existingErr } = await service
    .from("tenant_join_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("tenant_id", tenant.id)
    .eq("status", "PENDING")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; status: string }>();

  if (existingErr) {
    return NextResponse.json(
      { ok: false, data: null, error: `JOIN_REQUEST_LOOKUP_FAILED: ${existingErr.message}` },
      { status: 500 },
    );
  }

  if (existingPending?.id) {
    return NextResponse.json(
      {
        ok: true,
        data: { request_id: existingPending.id, alreadyPending: true },
        error: null,
      },
      { status: 200 },
    );
  }

  const { data: newRequest, error: insertErr } = await service
    .from("tenant_join_requests")
    .insert({
      tenant_id: tenant.id,
      user_id: user.id,
      requester_email: user.email ?? null,
      display_name: profile.display_name ?? null,
      status: "PENDING",
    })
    .select("id")
    .single<{ id: string }>();

  if (insertErr) {
    return NextResponse.json(
      { ok: false, data: null, error: `JOIN_REQUEST_CREATE_FAILED: ${insertErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: { request_id: newRequest.id, alreadyPending: false },
      error: null,
    },
    { status: 201 },
  );
}
