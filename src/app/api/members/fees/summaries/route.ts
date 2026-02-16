import { NextResponse } from "next/server";
import { createSupabaseServerReadClient } from "@/lib/supabase/server-read";
import type { MembershipFeeSummaryStatus } from "@/lib/membership-fees/types";

export const runtime = "nodejs";

type RpcSummaryRow = {
  member_id: string;
  open_amount_cents: number | string | null;
  open_count: number | string | null;
  has_overdue: boolean | null;
};

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function deriveStatus(openCount: number, hasOverdue: boolean): MembershipFeeSummaryStatus {
  if (openCount === 0) return "ALL_PAID";
  if (hasOverdue) return "OVERDUE_OPEN";
  return "PARTIAL_OPEN";
}

export async function GET() {
  const supabase = await createSupabaseServerReadClient();

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

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .maybeSingle<{ tenant_id: string | null }>();

  if (profileErr || !profile?.tenant_id) {
    return NextResponse.json(
      { ok: false, data: null, error: "TENANT_CONTEXT_NOT_FOUND" },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .rpc("membership_fee_summaries")
    .returns<RpcSummaryRow[]>();

  if (error) {
    return NextResponse.json(
      { ok: false, data: null, error: `SUMMARIES_FETCH_FAILED: ${error.message}` },
      { status: 500 },
    );
  }

  const rows: RpcSummaryRow[] = Array.isArray(data) ? data : [];

  const summaries = rows.map((row) => {
    const openCount = toNumber(row.open_count);
    const openAmountCents = toNumber(row.open_amount_cents);
    const hasOverdue = Boolean(row.has_overdue);

    return {
      member_id: row.member_id,
      status: deriveStatus(openCount, hasOverdue),
      openAmountCents,
      openCount,
    };
  });

  return NextResponse.json(
    { ok: true, data: { summaries }, error: null },
    { status: 200 },
  );
}
