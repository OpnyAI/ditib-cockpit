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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; invoiceId: string }> },
) {
  const { id, invoiceId } = await params;
  if (!id || !isUuid(id)) return fail("MEMBER_ID_INVALID", 400);
  if (!invoiceId || !isUuid(invoiceId)) return fail("INVOICE_ID_INVALID", 400);

  const ctx = await getFeeAuthContext();
  if (ctx instanceof NextResponse) return ctx;

  if (!canWriteFees(ctx.role)) return fail("FORBIDDEN", 403);

  const memberResult = await getTenantMember(ctx, id);
  if ("error" in memberResult) return memberResult.error;

  // JSON body is optional; if missing/invalid -> treat as empty object
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (!isRecord(body)) return fail("INVALID_JSON", 400);

  const paidAtRaw = typeof body.paid_at === "string" ? body.paid_at.trim() : "";
  const paidAt =
    !paidAtRaw
      ? null
      : isDateLike(paidAtRaw) || !Number.isNaN(Date.parse(paidAtRaw))
        ? new Date(paidAtRaw).toISOString()
        : null;

  if (paidAtRaw && !paidAt) return fail("PAID_AT_INVALID", 400);

  // 1) ensure invoice exists (and belongs to member)
  const { data: existingInvoice, error: existingInvoiceErr } = await ctx.supabase
    .from("membership_fee_invoices")
    .select(FEE_INVOICE_SELECT)
    .eq("id", invoiceId)
    .eq("member_id", id)
    .maybeSingle<MembershipFeeInvoice>();

  if (existingInvoiceErr) {
    return fail(`INVOICE_LOOKUP_FAILED: ${existingInvoiceErr.message}`, 500);
  }
  if (!existingInvoice) return fail("INVOICE_NOT_FOUND", 404);

  // 2) idempotency: if payment exists, do nothing
  const { data: existingPayment, error: existingPaymentErr } = await ctx.supabase
    .from("membership_fee_payments")
    .select("id")
    .eq("invoice_id", invoiceId)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (existingPaymentErr) {
    return fail(`PAYMENT_LOOKUP_FAILED: ${existingPaymentErr.message}`, 500);
  }

  if (existingPayment?.id) {
    return ok({ invoice: existingInvoice });
  }

  // 3) mark paid via RPC (creates payment + finance tx)
  const paidAtIso = paidAt ?? new Date().toISOString();

  const { error: markPaidErr } = await ctx.supabase.rpc(
    "mark_membership_fee_paid",
    {
      p_invoice_id: invoiceId,
      p_paid_at: paidAtIso,
    },
  );

  if (markPaidErr) {
    return fail(`MARK_PAID_FAILED: ${markPaidErr.message}`, 400);
  }

  // 4) refetch invoice and return
  const { data: updatedInvoice, error: updatedInvoiceErr } = await ctx.supabase
    .from("membership_fee_invoices")
    .select(FEE_INVOICE_SELECT)
    .eq("id", invoiceId)
    .eq("member_id", id)
    .maybeSingle<MembershipFeeInvoice>();

  if (updatedInvoiceErr) {
    return fail(`INVOICE_FETCH_FAILED: ${updatedInvoiceErr.message}`, 500);
  }
  if (!updatedInvoice) return fail("INVOICE_NOT_FOUND", 404);

  return ok({ invoice: updatedInvoice });
}
