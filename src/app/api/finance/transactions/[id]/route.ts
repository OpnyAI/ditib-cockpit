// src/app/api/finance/transactions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerReadClient } from "@/lib/supabase/server-read";

export const runtime = "nodejs";

type Role = "ADMIN" | "VORSTAND" | "KASSIERER" | "MITARBEITER";
type TxType = "INCOME" | "EXPENSE";

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

function isValidDateYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

type TxPatch = {
  is_archived?: boolean;
  archived_at?: string | null;
  archived_by?: string | null;
  type?: TxType;
  booking_date?: string;
  amount_cents?: number;
  account_id?: string;
  category_id?: string | null;
  counterparty?: string | null;
  memo?: string | null;
  reference?: string | null;
  updated_by?: string;
};

/**
 * ✅ IMPORTANT:
 * In deiner Umgebung kommt params.id offenbar leer an.
 * Deshalb ziehen wir die ID robust aus der URL (Fallback).
 */
function getRequestedId(req: Request, params?: { id?: string }) {
  const fromParams = typeof params?.id === "string" ? params.id.trim() : "";
  if (fromParams) return fromParams;

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1] ?? "";
  return last.trim();
}

async function getTxOr404(
  admin: ReturnType<typeof getAdminClient>,
  tenantId: string,
  id: string
) {
  const { data, error } = await admin
    .from("finance_transactions")
    .select(
      "id, tenant_id, account_id, category_id, type, booking_date, amount_cents, counterparty, memo, reference, is_archived, archived_at, archived_by, created_by, updated_by, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ctxAuth = await getAuthContext();
  if ("error" in ctxAuth) return ctxAuth.error;

  if (!canRead(ctxAuth.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("includeArchived") === "1";
  const debug = searchParams.get("debug") === "1";

  const requestedId = getRequestedId(req, { id });

  if (!requestedId || !isUuid(requestedId)) {
    return NextResponse.json(
      debug
        ? {
            error: "NOT_FOUND",
            debug: {
              note: "Invalid or missing id (params.id was empty and URL extraction failed/invalid).",
              requestedId,
              pathname: new URL(req.url).pathname,
            },
          }
        : { error: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const admin = getAdminClient();
  const tx = await getTxOr404(admin, ctxAuth.tenantId, requestedId);

  if (!tx) {
    // Optionaler Debug: Prüfen ob die Tx irgendwo existiert (ohne tenant filter)
    if (debug) {
      const { data: anyTx } = await admin
        .from("finance_transactions")
        .select("id, tenant_id, is_archived")
        .eq("id", requestedId)
        .maybeSingle<{ id: string; tenant_id: string; is_archived: boolean }>();

      return NextResponse.json(
        {
          error: "NOT_FOUND",
          debug: {
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
            ctxTenantId: ctxAuth.tenantId,
            ctxUserId: ctxAuth.userId,
            ctxRole: ctxAuth.role,
            requestedId,
            foundById: Boolean(anyTx),
            foundTenantIdById: anyTx?.tenant_id ?? null,
            foundIsArchivedById: anyTx?.is_archived ?? null,
            note:
              anyTx && anyTx.tenant_id !== ctxAuth.tenantId
                ? "Tenant mismatch (profile tenant != transaction tenant)"
                : "Not found at all (id does not exist in table)",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (!includeArchived && tx.is_archived) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ transaction: tx });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ctxAuth = await getAuthContext();
  if ("error" in ctxAuth) return ctxAuth.error;

  if (!canWrite(ctxAuth.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const requestedId = getRequestedId(req, { id });
  if (!requestedId || !isUuid(requestedId)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
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

  const admin = getAdminClient();

  // Prevent editing archived tx (historical integrity)
  const existing = await getTxOr404(admin, ctxAuth.tenantId, requestedId);
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const patch: TxPatch = {};

  /**
   * ✅ Soft-Archive Toggle (UI-friendly)
   * - allow unarchive even if currently archived
   * - block editing other fields when archived (keeps integrity)
   */
  if (b.isArchived !== undefined) {
    const isArchived =
      typeof b.isArchived === "boolean" ? b.isArchived : null;

    if (isArchived === null) {
      return NextResponse.json(
        { error: "IS_ARCHIVED_INVALID" },
        { status: 400 }
      );
    }

    if (isArchived) {
      patch.is_archived = true;
      patch.archived_at = new Date().toISOString();
      patch.archived_by = ctxAuth.userId;
    } else {
      patch.is_archived = false;
      patch.archived_at = null;
      patch.archived_by = null;
    }
  }

  // If archived and request is NOT an unarchive toggle → block
  if (existing.is_archived) {
    const isUnarchiveRequest = b.isArchived === false;
    if (!isUnarchiveRequest) {
      return NextResponse.json({ error: "ARCHIVED" }, { status: 409 });
    }
  }

  if (b.type !== undefined) {
    const type = b.type as TxType;
    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json({ error: "TYPE_INVALID" }, { status: 400 });
    }
    patch.type = type;
  }

  if (b.bookingDate !== undefined) {
    const bookingDate =
      typeof b.bookingDate === "string" ? b.bookingDate.trim() : "";
    if (!bookingDate || !isValidDateYYYYMMDD(bookingDate)) {
      return NextResponse.json(
        { error: "BOOKING_DATE_INVALID" },
        { status: 400 }
      );
    }
    patch.booking_date = bookingDate;
  }

  if (b.amountCents !== undefined) {
    const amountCents = Number(b.amountCents);
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      return NextResponse.json(
        { error: "AMOUNT_CENTS_INVALID" },
        { status: 400 }
      );
    }
    patch.amount_cents = amountCents;
  }

  if (b.accountId !== undefined) {
    const accountId = typeof b.accountId === "string" ? b.accountId : "";
    if (!accountId) {
      return NextResponse.json(
        { error: "ACCOUNT_ID_REQUIRED" },
        { status: 400 }
      );
    }
    patch.account_id = accountId;
  }

  if (b.categoryId !== undefined) {
    const categoryId =
      typeof b.categoryId === "string" ? b.categoryId : null;
    patch.category_id = categoryId;
  }

  if (b.counterparty !== undefined) {
    patch.counterparty =
      typeof b.counterparty === "string" && b.counterparty.trim()
        ? b.counterparty.trim()
        : null;
  }

  if (b.memo !== undefined) {
    patch.memo =
      typeof b.memo === "string" && b.memo.trim()
        ? b.memo.trim()
        : null;
  }

  if (b.reference !== undefined) {
    patch.reference =
      typeof b.reference === "string" && b.reference.trim()
        ? b.reference.trim()
        : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "NO_FIELDS" }, { status: 400 });
  }

  // Safety: account belongs to tenant
  if (patch.account_id) {
    const { data: acc, error: accErr } = await admin
      .from("finance_accounts")
      .select("id")
      .eq("tenant_id", ctxAuth.tenantId)
      .eq("id", patch.account_id)
      .single();

    if (accErr || !acc) {
      return NextResponse.json({ error: "ACCOUNT_NOT_FOUND" }, { status: 400 });
    }
  }

  // Safety: category belongs to tenant (or null allowed)
  if (patch.category_id !== undefined && patch.category_id !== null) {
    const { data: cat, error: catErr } = await admin
      .from("finance_categories")
      .select("id")
      .eq("tenant_id", ctxAuth.tenantId)
      .eq("id", patch.category_id)
      .single();

    if (catErr || !cat) {
      return NextResponse.json(
        { error: "CATEGORY_NOT_FOUND" },
        { status: 400 }
      );
    }
  }

  // ✅ Audit Actor
  patch.updated_by = ctxAuth.userId;

  const { data, error } = await admin
    .from("finance_transactions")
    .update(patch)
    .eq("tenant_id", ctxAuth.tenantId)
    .eq("id", requestedId)
    .select(
      "id, tenant_id, account_id, category_id, type, booking_date, amount_cents, counterparty, memo, reference, is_archived, archived_at, archived_by, created_by, updated_by, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "UPDATE_FAILED" },
      { status: 400 }
    );
  }

  return NextResponse.json({ transaction: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ctxAuth = await getAuthContext();
  if ("error" in ctxAuth) return ctxAuth.error;

  if (!canWrite(ctxAuth.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const requestedId = getRequestedId(req, { id });
  if (!requestedId || !isUuid(requestedId)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const admin = getAdminClient();

  // If already archived: idempotent success
  const existing = await getTxOr404(admin, ctxAuth.tenantId, requestedId);
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (existing.is_archived) {
    return NextResponse.json({ transaction: existing });
  }

  const { data, error } = await admin
    .from("finance_transactions")
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: ctxAuth.userId,
      updated_by: ctxAuth.userId, // ✅ Audit Actor
    })
    .eq("tenant_id", ctxAuth.tenantId)
    .eq("id", requestedId)
    .select(
      "id, tenant_id, account_id, category_id, type, booking_date, amount_cents, counterparty, memo, reference, is_archived, archived_at, archived_by, created_by, updated_by, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "ARCHIVE_FAILED" },
      { status: 400 }
    );
  }

  return NextResponse.json({ transaction: data });
}
