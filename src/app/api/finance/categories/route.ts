import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerReadClient } from "@/lib/supabase/server-read";

export const runtime = "nodejs";

type Role = "ADMIN" | "VORSTAND" | "KASSIERER" | "MITARBEITER";
type CategoryType = "INCOME" | "EXPENSE";

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

export async function GET(req: Request) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  if (!canRead(ctx.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // optional

  const admin = getAdminClient();

  let q = admin
    .from("finance_categories")
    .select(
      "id, tenant_id, type, name, sort_order, is_archived, created_at, updated_at"
    )
    .eq("tenant_id", ctx.tenantId)
    .order("type", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (type) q = q.eq("type", type);

  const { data, error } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  if (!canWrite(ctx.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const type = body?.type as CategoryType;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const sortOrder = Number.isFinite(body?.sortOrder)
    ? Number(body.sortOrder)
    : 0;

  if (type !== "INCOME" && type !== "EXPENSE") {
    return NextResponse.json({ error: "TYPE_INVALID" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
  }
  if (!Number.isInteger(sortOrder)) {
    return NextResponse.json(
      { error: "SORT_ORDER_MUST_BE_INT" },
      { status: 400 }
    );
  }

  const admin = getAdminClient();

  const { data, error } = await admin
    .from("finance_categories")
    .insert({
      tenant_id: ctx.tenantId,
      type,
      name,
      sort_order: sortOrder,
      is_archived: false,
    })
    .select(
      "id, tenant_id, type, name, sort_order, is_archived, created_at, updated_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ category: data }, { status: 201 });
}
