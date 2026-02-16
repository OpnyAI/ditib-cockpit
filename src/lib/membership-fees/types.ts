export type MembershipFeeInterval = "MONTHLY" | "QUARTERLY" | "YEARLY";

export type MembershipFeeInvoiceStatus = "OPEN" | "PAID" | "PARTIAL" | "OVERDUE";

export type MembershipFeeRule = {
  id: string;
  member_id: string;
  amount_cents: number;
  interval: MembershipFeeInterval;
  due_day: number;
  created_at: string;
  updated_at: string;
};

export type MembershipFeeInvoice = {
  id: string;
  member_id: string;
  rule_id: string | null;
  due_date: string;
  amount_cents: number;
  status: MembershipFeeInvoiceStatus;
  generated_at: string;
  paid_at: string | null;
};

export type MembershipFeePayment = {
  id: string;
  invoice_id: string;
  transaction_id: string | null;
  paid_amount_cents: number;
  paid_at: string;
};

export type MembershipFeeSummaryStatus = "ALL_PAID" | "PARTIAL_OPEN" | "OVERDUE_OPEN" | "UNKNOWN";

export type MembershipFeeSummary = {
  status: MembershipFeeSummaryStatus;
  openAmountCents: number;
  openCount: number;
};
