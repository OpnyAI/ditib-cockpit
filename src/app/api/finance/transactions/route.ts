// src/app/api/finance/transactions/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerReadClient } from "@/lib/supabase/server-read";
import type {
  FinanceTransaction,
  FinanceTransactionsListResponse,
  FinanceTransactionCreateResponse,
  TxType,
} from "@/lib/finance/types";

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

function isValidDateYYYYMMDD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

const TX_SELECT =
  "id, tenant_id, account_id, category_id, type, booking_date, amount_cents, counterparty, memo, reference, is_archived, archived_at, archived_by, created_by, updated_by, created_at, updated_at";

export async function GET(req: Request) {
  const ctx = await getAuthContext();
  if ("error" in ctx) return ctx.error;

  if (!canRead(ctx.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  // Optional filters:
  // month=YYYY-MM
  // type=INCOME|EXPENSE
  // accountId=uuid
  // includeArchived=1
  // limit, offset
  const month = searchParams.get("month");
  const type = searchParams.get("type");
  const accountId = searchParams.get("accountId");
  const includeArchived = searchParams.get("includeArchived") === "1";

  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "200", 10), 1),
    500
  );
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

  const admin = getAdminClient();

  let q = admin
    .from("finance_transactions")
    .select(TX_SELECT)
    .eq("tenant_id", ctx.tenantId)
    .order("booking_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (!includeArchived) q = q.eq("is_archived", false);
  if (type) q = q.eq("type", type);
  if (accountId) q = q.eq("account_id", accountId);

  if (month) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "MONTH_INVALID" }, { status: 400 });
    }

    const start = `${month}-01`;
    const [yStr, mStr] = month.split("-");
    const y = Number(yStr);
    const m = Number(mStr);

    const nextMonthFirst =
      m === 12
        ? `${y + 1}-01-01`
        : `${yStr}-${String(m + 1).padStart(2, "0")}-01`;

    q = q.gte("booking_date", start).lt("booking_date", nextMonthFirst);
  }

  const { data, error } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payload: FinanceTransactionsListResponse = {
    transactions: (data ?? []) as FinanceTransaction[],
    limit,
    offset,
  };

  return NextResponse.json(payload);
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

  const type = b.type as TxType;
  const bookingDate =
    typeof b.bookingDate === "string" ? b.bookingDate.trim() : "";
  const amountCents = Number(b.amountCents);
  const accountId = typeof b.accountId === "string" ? b.accountId : "";
  const categoryId =
    typeof b.categoryId === "string" ? b.categoryId : null;

  const counterparty =
    typeof b.counterparty === "string" ? b.counterparty.trim() : null;
  const memo = typeof b.memo === "string" ? b.memo.trim() : null;
  const reference =
    typeof b.reference === "string" ? b.reference.trim() : null;

  if (type !== "INCOME" && type !== "EXPENSE") {
    return NextResponse.json({ error: "TYPE_INVALID" }, { status: 400 });
  }
  if (!bookingDate || !isValidDateYYYYMMDD(bookingDate)) {
    return NextResponse.json(
      { error: "BOOKING_DATE_INVALID" },
      { status: 400 }
    );
  }
  if (!accountId) {
    return NextResponse.json({ error: "ACCOUNT_ID_REQUIRED" }, { status: 400 });
  }
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return NextResponse.json(
      { error: "AMOUNT_CENTS_INVALID" },
      { status: 400 }
    );
  }

  const admin = getAdminClient();

  // Safety: account must belong to tenant
  const { data: acc, error: accErr } = await admin
    .from("finance_accounts")
    .select("id")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", accountId)
    .single();

  if (accErr || !acc) {
    return NextResponse.json({ error: "ACCOUNT_NOT_FOUND" }, { status: 400 });
  }

  // Safety: category must belong to tenant if provided
  if (categoryId) {
    const { data: cat, error: catErr } = await admin
      .from("finance_categories")
      .select("id")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", categoryId)
      .single();

    if (catErr || !cat) {
      return NextResponse.json(
        { error: "CATEGORY_NOT_FOUND" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await admin
    .from("finance_transactions")
    .insert({
      tenant_id: ctx.tenantId,
      account_id: accountId,
      category_id: categoryId,
      type,
      booking_date: bookingDate,
      amount_cents: amountCents,
      counterparty,
      memo,
      reference,
      is_archived: false,
      created_by: ctx.userId, // ✅ Audit Actor
    })
    .select(TX_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const payload: FinanceTransactionCreateResponse = {
    transaction: data as FinanceTransaction,
  };

  return NextResponse.json(payload, { status: 201 });
}
