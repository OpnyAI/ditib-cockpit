import { NextResponse } from "next/server";
import type { MembershipFeeInterval, MembershipFeeInvoice, MembershipFeeRule } from "@/lib/membership-fees/types";
import {
  canReadMemberFees,
  canWriteFees,
  fail,
  getFeeAuthContext,
  getTenantMember,
  isRecord,
  isUuid,
  ok,
} from "@/lib/membership-fees/api";

export const runtime = "nodejs";

const FEE_RULE_SELECT =
  "id, member_id, amount_cents, interval, due_day, created_at, updated_at";
const FEE_INVOICE_SELECT =
  "id, member_id, rule_id, due_date, amount_cents, status, generated_at, paid_at";

function isInterval(value: unknown): value is MembershipFeeInterval {
  return value === "MONTHLY" || value === "QUARTERLY" || value === "YEARLY";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id || !isUuid(id)) return fail("MEMBER_ID_INVALID", 400);

  const ctx = await getFeeAuthContext();
  if (ctx instanceof NextResponse) return ctx;

  const memberResult = await getTenantMember(ctx, id);
  if ("error" in memberResult) return memberResult.error;

  if (!canReadMemberFees(ctx, memberResult.member.email)) {
    return fail("FORBIDDEN", 403);
  }

  const [{ data: rule, error: ruleErr }, { data: invoices, error: invoiceErr }] =
    await Promise.all([
      ctx.supabase
        .from("membership_fee_rules")
        .select(FEE_RULE_SELECT)
        .eq("member_id", id)
        .maybeSingle<MembershipFeeRule>(),
      ctx.supabase
        .from("membership_fee_invoices")
        .select(FEE_INVOICE_SELECT)
        .eq("member_id", id)
        .order("due_date", { ascending: false })
        .returns<MembershipFeeInvoice[]>(),
    ]);

  if (ruleErr) return fail(`RULE_FETCH_FAILED: ${ruleErr.message}`, 500);
  if (invoiceErr) return fail(`INVOICE_FETCH_FAILED: ${invoiceErr.message}`, 500);

  return ok({
    rule: rule ?? null,
    invoices: invoices ?? [],
  });
}

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

  const amountCents = Number(body.amount_cents);
  const interval = body.interval;
  const dueDay = Number(body.due_day);

  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return fail("AMOUNT_CENTS_INVALID", 400);
  }
  if (!isInterval(interval)) {
    return fail("INTERVAL_INVALID", 400);
  }
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    return fail("DUE_DAY_INVALID", 400);
  }

  const { data: existing, error: existingErr } = await ctx.supabase
    .from("membership_fee_rules")
    .select("id")
    .eq("member_id", id)
    .maybeSingle<{ id: string }>();

  if (existingErr) return fail(`RULE_LOOKUP_FAILED: ${existingErr.message}`, 500);

  if (existing) {
    const { data, error } = await ctx.supabase
      .from("membership_fee_rules")
      .update({
        amount_cents: amountCents,
        interval,
        due_day: dueDay,
      })
      .eq("id", existing.id)
      .select(FEE_RULE_SELECT)
      .single<MembershipFeeRule>();

    if (error) return fail(`RULE_UPDATE_FAILED: ${error.message}`, 400);
    return ok({ rule: data }, 200);
  }

  const { data, error } = await ctx.supabase
    .from("membership_fee_rules")
    .insert({
      member_id: id,
      amount_cents: amountCents,
      interval,
      due_day: dueDay,
    })
    .select(FEE_RULE_SELECT)
    .single<MembershipFeeRule>();

  if (error) return fail(`RULE_CREATE_FAILED: ${error.message}`, 400);

  return ok({ rule: data }, 201);
}
