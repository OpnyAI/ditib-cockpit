import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerReadClient } from "@/lib/supabase/server-read";

export const runtime = "nodejs";

type Role = "ADMIN" | "VORSTAND" | "KASSIERER" | "MITARBEITER";

function getAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase env vars. Require NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getAuthContext() {
  const supabase = await createSupabaseServerReadClient();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return {
      error: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }),
    };
  }

  const userId = userData.user.id;

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("user_id", userId)
    .single();

  if (profileErr || !profile) {
    return {
      error: NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 403 }),
    };
  }

  const tenantId = profile.tenant_id as string | null;
  const role = profile.role as Role;

  if (!tenantId) {
    return {
      error: NextResponse.json({ error: "TENANT_NOT_SET" }, { status: 403 }),
    };
  }

  return { userId, tenantId, role };
}

function canRead(role: Role) {
  return role === "ADMIN" || role === "KASSIERER" || role === "VORSTAND";
}

function canWrite(role: Role) {
  return role === "ADMIN" || role === "KASSIERER";
}

export async function GET() {
  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  if (!canRead(ctx.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const admin = getAdminClient();

  const { data, error } = await admin
    .from("finance_accounts")
    .select(
      "id, tenant_id, name, currency, opening_balance_cents, is_archived, created_by, updated_by, created_at, updated_at"
    )
    .eq("tenant_id", ctx.tenantId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ accounts: data ?? [] });
}

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  if (!canWrite(ctx.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  const currency =
    typeof b.currency === "string" && b.currency.trim()
      ? b.currency.trim()
      : "EUR";
  const openingBalanceCents =
    typeof b.openingBalanceCents === "number" &&
    Number.isFinite(b.openingBalanceCents)
      ? Number(b.openingBalanceCents)
    : 0;

  if (!name) {
    return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
  }
  if (!Number.isInteger(openingBalanceCents)) {
    return NextResponse.json(
      { error: "OPENING_BALANCE_MUST_BE_INTEGER_CENTS" },
      { status: 400 }
    );
  }

  const admin = getAdminClient();

  const { data, error } = await admin
    .from("finance_accounts")
    .insert({
      tenant_id: ctx.tenantId,
      name,
      currency,
      opening_balance_cents: openingBalanceCents,
      is_archived: false,
      created_by: ctx.userId, // ✅ wichtig für Audit Actor
    })
    .select(
      "id, tenant_id, name, currency, opening_balance_cents, is_archived, created_by, updated_by, created_at, updated_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ account: data }, { status: 201 });
}
