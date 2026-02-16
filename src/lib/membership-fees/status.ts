import type { MembershipFeeInvoice, MembershipFeeSummary } from "@/lib/membership-fees/types";

function isOpenStatus(status: MembershipFeeInvoice["status"]) {
  return status === "OPEN" || status === "PARTIAL" || status === "OVERDUE";
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function deriveMembershipFeeSummary(
  invoices: MembershipFeeInvoice[],
  nowDateIso = todayIsoDate(),
): MembershipFeeSummary {
  const openInvoices = invoices.filter((invoice) => isOpenStatus(invoice.status));
  const openAmountCents = openInvoices.reduce((sum, invoice) => sum + invoice.amount_cents, 0);
  const hasOverdue = openInvoices.some(
    (invoice) => invoice.status === "OVERDUE" || invoice.due_date < nowDateIso,
  );

  if (openInvoices.length === 0) {
    return { status: "ALL_PAID", openAmountCents: 0, openCount: 0 };
  }

  if (hasOverdue) {
    return {
      status: "OVERDUE_OPEN",
      openAmountCents,
      openCount: openInvoices.length,
    };
  }

  return {
    status: "PARTIAL_OPEN",
    openAmountCents,
    openCount: openInvoices.length,
  };
}
