import { NextResponse } from "next/server";
import type { MembershipFeeInvoice } from "@/lib/membership-fees/types";
import {
  canWriteFees,
  fail,
  getFeeAuthContext,
  getTenantMember,
  isDateLike,
  isRecord,
  isUuid,
  ok,
} from "@/lib/membership-fees/api";

export const runtime = "nodejs";

const FEE_INVOICE_SELECT =
  "id, member_id, rule_id, due_date, amount_cents, status, generated_at, paid_at";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id || !isUuid(id)) return fail("MEMBER_ID_INVALID", 400);

  const ctx = await getFeeAuthContext();
  if (ctx instanceof NextResponse) return ctx;

  if (!canWriteFees(ctx.role)) return fail("FORBIDDEN", 403);

  const memberResult = await getTenantMember(ctx, id);
  if ("error" in memberResult) return memberResult.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_JSON", 400);
  }

  if (!isRecord(body)) return fail("INVALID_JSON", 400);

  const dueDate = typeof body.due_date === "string" ? body.due_date.trim() : "";
  const amountCents = Number(body.amount_cents);

  if (!isDateLike(dueDate)) return fail("DUE_DATE_INVALID", 400);
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return fail("AMOUNT_CENTS_INVALID", 400);
  }

  const { data: rule } = await ctx.supabase
    .from("membership_fee_rules")
    .select("id")
    .eq("member_id", id)
    .maybeSingle<{ id: string }>();

  const today = new Date().toISOString().slice(0, 10);
  const status: MembershipFeeInvoice["status"] = dueDate < today ? "OVERDUE" : "OPEN";

  const { data, error } = await ctx.supabase
    .from("membership_fee_invoices")
    .insert({
      member_id: id,
      rule_id: rule?.id ?? null,
      due_date: dueDate,
      amount_cents: amountCents,
      status,
    })
    .select(FEE_INVOICE_SELECT)
    .single<MembershipFeeInvoice>();

  if (error) return fail(`INVOICE_CREATE_FAILED: ${error.message}`, 400);

  return ok({ invoice: data }, 201);
}
