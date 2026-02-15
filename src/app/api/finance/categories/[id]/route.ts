// src/app/api/finance/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
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

type CategoryPatch = {
  type?: CategoryType;
  name?: string;
  sort_order?: number;
  is_archived?: boolean;
  updated_by?: string;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  if (!canRead(ctx.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const admin = getAdminClient();

  const { data, error } = await admin
    .from("finance_categories")
    .select(
      "id, tenant_id, type, name, sort_order, is_archived, created_by, updated_by, created_at, updated_at"
    )
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ category: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
  const patch: CategoryPatch = {};

  if (b.type !== undefined) {
    const type = b.type as CategoryType;
    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json({ error: "TYPE_INVALID" }, { status: 400 });
    }
    patch.type = type;
  }

  if (typeof b.name === "string") {
    const name = b.name.trim();
    if (!name) {
      return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
    }
    patch.name = name;
  }

  if (b.sortOrder !== undefined) {
    const v = Number(b.sortOrder);
    if (!Number.isInteger(v)) {
      return NextResponse.json(
        { error: "SORT_ORDER_MUST_BE_INT" },
        { status: 400 }
      );
    }
    patch.sort_order = v;
  }

  if (typeof b.is_archived === "boolean") {
    patch.is_archived = b.is_archived;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "NO_FIELDS" }, { status: 400 });
  }

  // ✅ Audit Actor: setzen wir IMMER serverseitig
  patch.updated_by = ctx.userId;

  const admin = getAdminClient();

  const { data, error } = await admin
    .from("finance_categories")
    .update(patch)
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .select(
      "id, tenant_id, type, name, sort_order, is_archived, created_by, updated_by, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "UPDATE_FAILED" },
      { status: 400 }
    );
  }

  return NextResponse.json({ category: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  if (!canWrite(ctx.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const admin = getAdminClient();

  // Produktiv-Default: soft-delete via archive
  const { data, error } = await admin
    .from("finance_categories")
    .update({ is_archived: true, updated_by: ctx.userId }) // ✅ Audit Actor
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .select(
      "id, tenant_id, type, name, sort_order, is_archived, created_by, updated_by, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "DELETE_FAILED" },
      { status: 400 }
    );
  }

  return NextResponse.json({ category: data });
}
